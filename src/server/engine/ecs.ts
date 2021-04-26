import { NetworkState } from '../../shared/game/network-state'
import { IdManager } from './id-manager'

export class ECS<CT, T extends keyof CT> {
  private readonly networkState: NetworkState
  private readonly entitiesMap: Map<string, Entity<CT, T>> = new Map<string, Entity<CT, T>>()
  private readonly entityComponentMap: Record<T, Set<Entity<CT, T>>>
  private readonly systems: System<CT, T>[] = []
  constructor(networkState: NetworkState, componentTags: readonly T[]) {
    this.networkState = networkState
    this.entityComponentMap = {} as any
    componentTags.forEach(componentTag => {
      this.entityComponentMap[componentTag] = new Set<Entity<CT, T>>()
    })
  }
  start() {
    this.entitiesMap.forEach(entity => entity.getComponents().forEach(component => component.start()))
  }
  tick() {
    this.systems.forEach(system => system.tick())
  }
  createEntity(): Entity<CT, T> {
    const entity = new Entity<CT, T>(this, IdManager.generateId())
    this.entitiesMap.set(entity.id, entity)
    return entity
  }
  addSystem<S extends System<CT, T>>(systemClass: new (ecs: ECS<CT, T>, networkState: NetworkState) => S): ECS<CT, T> {
    this.systems.push(new systemClass(this, this.networkState))
    return this
  }
  getEntitiesWithComponents(componentTags: readonly T[]): Set<Entity<CT, T>> {
    const entitySets = componentTags.map(tag => this.entityComponentMap[tag])
    const intersectionEntities = entitySets.reduce(intersection)
    return intersectionEntities
  }
  getEntities(): Entity<CT, T>[] {
    return Array.from(this.entitiesMap.values())
  }
  getEntityById(id: string): Entity<CT, T> | undefined {
    return this.entitiesMap.get(id)
  }
  __addEntityToComponentSet(entity: Entity<CT, T>, componentTag: T) {
    this.entityComponentMap[componentTag].add(entity)
  }
}

export class Entity<CT, T extends keyof CT> {
  private readonly ecs: ECS<CT, T>
  readonly id: string
  private readonly components: Set<Component<CT, T>> = new Set()
  private readonly componentMap = new Map<T, Component<CT, T>>()
  constructor(ecs: ECS<CT, T>, id: string) {
    this.ecs = ecs
    this.id = id
  }
  addComponent(component: Component<CT, T>): Entity<CT, T> {
    component._setEntity(this)
    this.components.add(component)
    this.ecs.__addEntityToComponentSet(this, component.getTag())
    this.componentMap.set(component.getTag(), component)
    return this
  }
  getComponent<K extends T>(componentTag: K): CT[K] {
    return (this.componentMap.get(componentTag) as unknown) as CT[K]
  }
  getComponents(): Set<Component<CT, T>> {
    return this.components
  }
}

export abstract class Component<CT, T extends keyof CT> {
  protected entity!: Entity<CT, T>
  _setEntity(entity: Entity<CT, T>) {
    this.entity = entity
  }
  start() {}
  getTag(): T {
    return this.constructor.prototype.tag
  }
}

export abstract class System<CT, T extends keyof CT> {
  private readonly ecs: ECS<CT, T>
  protected readonly networkState: NetworkState
  protected abstract readonly dependentComponentTags: readonly T[]
  protected abstract onTick(entity: Entity<CT, T>): void
  constructor(ecs: ECS<CT, T>, networkState: NetworkState) {
    this.ecs = ecs
    this.networkState = networkState
  }
  tick() {
    this.ecs.getEntitiesWithComponents(this.dependentComponentTags).forEach(entity => this.onTick(entity))
  }
}

const usedComponentTags: any[] = []
export function TaggedComponent<CT, T extends keyof CT>(tag: T): { new (): Component<CT, T> } {
  if (usedComponentTags.includes(tag)) {
    throw new Error(`ECS: Tag '${tag}' used in multiple calls to 'TaggedComponent' function`)
  }
  usedComponentTags.push(tag)
  const cls = class extends Component<CT, T> {}
  ;(cls.prototype as any).tag = tag
  return cls
}

function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const intersection = new Set<T>()
  b.forEach(elem => {
    if (a.has(elem)) {
      intersection.add(elem)
    }
  })
  return intersection
}
