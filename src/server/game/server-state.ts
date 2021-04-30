import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { ECS as ECSECS, Entity as ECSEntity } from '../engine/ecs'
import { IdManager } from '../engine/id-manager'
import { components, Components, ComponentTags } from './components'
import { Library } from './library'
import { Combat, Movement, Reaction } from './systems'

export type Entity = ECSEntity<ComponentTags, Components>
export type ECS = ECSECS<ComponentTags, Components>

export class ServerState {
  private readonly networkState: NetworkState
  private readonly ecs: ECS
  constructor(networkState: NetworkState) {
    this.networkState = networkState
    this.ecs = new ECSECS<ComponentTags, Components>(this.networkState, this, components)
      .addSystem(Movement)
      .addSystem(Reaction)
      .addSystem(Combat)
  }
  tickEcs() {
    this.ecs.tick()
  }
  tickSlowEcs() {
    this.ecs.tickSlow()
  }
  createEntity(kind: keyof typeof Library.Entities, options: any) {
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
  addItem(entityId: string, kind: string, options: any) {
    const entity = this.ecs.getEntityById(entityId)
    if (!entity) return
    const id = IdManager.generateId()
    this.networkState.createItem(id, kind, options)
    entity.getComponent('Inventory')?.addItem(id)
  }
}
