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

  private teams: string[] = []
  @Pushable()
  setTeams(value: string[]) {
    this.teams = value
  }
  getTeams(): string[] {
    return this.teams
  }

  // Entities
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

  // Fixtures
  private fixtures = new Map<string, NSFixture>()
  @Pushable()
  createFixture(id: string, kind: string, position: Vec2, rotation: number, scale: number) {
    const fixture: NSFixture = {
      id: id,
      kind: kind,
      position: new Vec2(position.x, position.y),
      rotation: rotation,
      scale: scale,
    }
    this.fixtures.set(fixture.id, fixture)
  }
  @Pushable()
  deleteFixture(id: string) {
    this.fixtures.delete(id)
  }
  getFixtures(): NSFixture[] {
    return Array.from(this.fixtures.values())
  }
  getFixture(id: string): NSFixture | undefined {
    return this.fixtures.get(id)
  }

  // Items
  private items = new Map<string, NSItem>()
  @Pushable()
  createItem(id: string, kind: string, options: any) {
    this.items.set(id, {
      id: id,
      kind: kind,
      ...options,
    })
  }
  @Pushable()
  updateItem(item: NSItem) {
    if (!this.items.has(item.id)) return
    this.items.set(item.id, item)
  }
  getItem(id: string): NSItem | undefined {
    return this.items.get(id)
  }
}

export interface NSFixture {
  id: string
  kind: string
  position: Vec2
  rotation: number
  scale: number
}

export interface NSEntity {
  id: string
  kind: string
  components: Map<string, any>
}

export interface NSItem {
  id: string
  kind: string
  quantity?: number
}
