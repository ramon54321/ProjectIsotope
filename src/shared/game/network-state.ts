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
  private entities = new Map<string, NSEntity>()
  @Pushable()
  addEntity(entity: NSEntity) {
    this.entities.set(entity.id, entity)
  }
  @Pushable()
  removeEntity(id: string) {
    this.entities.delete(id)
  }
  getEntities(): NSEntity[] {
    return Array.from(this.entities.values())
  }
  getEntity(id: string): NSEntity | undefined {
    return this.entities.get(id)
  }
  @Pushable()
  setEntityPositionX(id: string, x: number) {
    const entity = this.entities.get(id)
    if (!entity) return
    entity.position.x = x
  }
  @Pushable()
  setEntityPositionY(id: string, y: number) {
    const entity = this.entities.get(id)
    if (!entity) return
    entity.position.y = y
  }
  @Pushable()
  setEntityPosition(id: string, x: number, y: number) {
    const entity = this.entities.get(id)
    if (!entity) return
    entity.position.x = x
    entity.position.y = y
  }
  @Pushable()
  moveEntity(id: string, dx: number, dy: number) {
    const entity = this.entities.get(id)
    if (!entity) return
    entity.position.x += dx
    entity.position.y += dy
  }
}

export interface NSEntity {
  id: string
  kind: string
  position: Vec2
}
