import { Vec2 } from '../shared/engine/math'
import { NetworkState } from '../shared/game/network-state'
import { Entity } from './entity'
import { IdManager } from './id-manager'

export class ServerState {
  private readonly networkState: NetworkState
  private readonly entitiesMap = new Map<string, Entity>()
  constructor(networkState: NetworkState) {
    this.networkState = networkState
    setTimeout(() => this.createEntity(new Vec2(100, 100)), 3000)
  }
  createEntity(position: Vec2 = new Vec2(0, 0)) {
    const id = IdManager.generateId()
    const entity = new Entity(this.networkState, id, 'dummy', position)
    this.entitiesMap.set(id, entity)
    this.networkState.addEntity({
      id: id,
      kind: 'dummy',
      position: position,
    })
  }
  setEntityMoveTarget(entityId: string, target: Vec2) {
    this.entitiesMap.get(entityId)?.setMoveTarget(target)
  }
  tick() {
    this.entitiesMap.forEach(entity => entity.tick())
  }
}
