import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { ECS as ECSECS, Entity as ECSEntity } from '../engine/ecs'
import { components, Components, ComponentTags } from './components'
import { Library } from './library'
import { Movement, Reaction } from './systems'

export type Entity = ECSEntity<ComponentTags, Components>
export type ECS = ECSECS<ComponentTags, Components>

export class ServerState {
  private readonly networkState: NetworkState
  private readonly ecs: ECS
  constructor(networkState: NetworkState) {
    this.networkState = networkState
    this.ecs = new ECSECS<ComponentTags, Components>(this.networkState, this, components).addSystem(Movement).addSystem(Reaction)
  }
  createEntity(kind: keyof typeof Library.Entities, options: any) {
    const entity = Library.Entities[kind].constructor(this.ecs, options)
    this.networkState.createEntity(entity.id, kind)
    entity.getComponents().forEach(component => component.updateNetworkState())
  }
  setEntityMoveTarget(entityId: string, target: Vec2) {
    this.ecs.getEntityById(entityId)?.getComponent('Position')?.setTargetPosition(target.x, target.y)
  }
  tickEcs() {
    this.ecs.tick()
  }
  tickSlowEcs() {
    this.ecs.tickSlow()
  }
}
