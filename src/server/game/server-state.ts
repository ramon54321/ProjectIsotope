import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { ECS, Entity as ECSEntity } from '../engine/ecs'
import { components, Components, ComponentTags, Identity, Position } from './components'
import { Movement } from './systems'

export type Entity = ECSEntity<ComponentTags, Components>

export class ServerState {
  private readonly networkState: NetworkState
  private readonly ecs: ECS<ComponentTags, Components>
  constructor(networkState: NetworkState) {
    this.networkState = networkState
    this.ecs = new ECS<ComponentTags, Components>(this.networkState, components).addSystem(Movement)
  }
  createEntity(position: Vec2 = new Vec2(0, 0)) {
    const entity = this.ecs.createEntity().addComponent(new Position(position.x, position.y)).addComponent(new Identity())
    this.networkState.addEntity({
      id: entity.id,
      kind: 'dummy',
      position: position,
    })
  }
  setEntityMoveTarget(entityId: string, target: Vec2) {
    this.ecs.getEntityById(entityId)?.getComponent('Position')?.setTargetPosition(target.x, target.y)
  }
  tick() {
    this.ecs.tick()
  }
}
