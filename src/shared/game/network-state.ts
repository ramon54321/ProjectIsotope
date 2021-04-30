import { Vec2 } from '../engine/math'
import { Serializable } from '../engine/serialization'
import { Pushable, State } from '../engine/sync'

@Serializable()
export class NetworkState extends State {
  private worldName: string = 'Pandora'
  @Pushable()
  setWorldName(value: string) {
    this.worldName = value
  }
  getWorldName(): string {
    return this.worldName
  }
  private serverTickRate: number = 1
  @Pushable()
  setServerTickRate(value: number) {
    this.serverTickRate = value
  }
  getServerTickRate(): number {
    return this.serverTickRate
  }
  private entities = new Map<string, NSEntity>()
  @Pushable()
  createEntity(id: string, kind: string) {
    const entity = {
      id: id,
      kind: kind,
      position: new Vec2(0, 0),
      components: new Map<string, any>(),
    }
    this.entities.set(entity.id, entity)
  }
  @Pushable()
  deleteEntity(id: string) {
    this.entities.delete(id)
  }
  getEntities(): NSEntity[] {
    return Array.from(this.entities.values())
  }
  getEntity(id: string): NSEntity | undefined {
    return this.entities.get(id)
  }
  @Pushable()
  setEntityComponent(id: string, componentKey: string, value: any) {
    const entity = this.entities.get(id)
    if (!entity) return
    entity.components.set(componentKey, value)
  }
  getEntityComponent(id: string, componentKey: string): any {
    return this.entities.get(id)?.components.get(componentKey)
  }
  private items = new Map<string, NSItem>()
  @Pushable()
  createItem(id: string, kind: string, options: any) {
    this.items.set(id, {
      id: id,
      kind: kind,
      ...options,
    })
  }
  getItem(id: string): NSItem | undefined {
    return this.items.get(id)
  }
}

export interface NSEntity {
  id: string
  kind: string
  components: Map<string, any>
}

export interface NSItem {
  id: string
  kind: string
}
