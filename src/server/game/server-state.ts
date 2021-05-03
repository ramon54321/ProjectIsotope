import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { EntityTag, ItemTag } from '../../shared/game/stats'
import { ECS as ECSECS, Entity as ECSEntity } from '../engine/ecs'
import { IdManager } from '../engine/id-manager'
import { components, Components, ComponentTags } from './components'
import { Library } from './library'
import { Combat, Factories, Movement, Reaction } from './systems'

export type Entity = ECSEntity<ComponentTags, Components>
export type ECS = ECSECS<ComponentTags, Components>

export class ServerState {
  private readonly networkState: NetworkState
  private readonly ecs: ECS
  readonly sendClassBInstant: (payload: any) => void
  constructor(networkState: NetworkState, sendClassBInstant: (payload: any) => void) {
    this.networkState = networkState
    this.sendClassBInstant = sendClassBInstant
    this.ecs = new ECSECS<ComponentTags, Components>(this.networkState, this, components)
      .addSystem(Movement)
      .addSystem(Reaction)
      .addSystem(Combat)
      .addSystem(Factories)
  }
  tickEcs() {
    this.ecs.tick()
  }
  tickSlowEcs() {
    this.ecs.tickSlow()
  }
  createEntity(kind: EntityTag, options: { position?: Vec2; team?: number }) {
    const entity = Library.Entities[kind].constructor(this.ecs, options)
    this.networkState.createEntity(entity.id, kind)
    entity.getComponents().forEach(component => component.updateNetworkState())
  }
  deleteEntity(id: string) {
    if (!this.ecs.deleteEntity(id)) return
    this.networkState.deleteEntity(id)
  }
  setEntityMoveTarget(entityId: string, target: Vec2) {
    this.ecs.getEntityById(entityId)?.getComponent('Position')?.setTargetPosition(target.x, target.y)
  }
  addItem(entityId: string, kind: ItemTag, options: any) {
    const entity = this.ecs.getEntityById(entityId)
    if (!entity) return
    const existingItem = entity.getComponent('Inventory')?.getFirstItemOfKind(kind)
    if (existingItem) {
      existingItem.quantity = existingItem.quantity || 1
      existingItem.quantity += options.quantity || 1
      this.networkState.updateItem(existingItem)
      return
    }
    const id = IdManager.generateId()
    this.networkState.createItem(id, kind, options)
    entity.getComponent('Inventory')?.addItem(id)
  }
  submitOrder(entityId: string, kind: EntityTag, options: any) {
    const entity = this.ecs.getEntityById(entityId)
    if (!entity) return
    entity.getComponent('Factory')?.submitOrder(kind)
  }
}
