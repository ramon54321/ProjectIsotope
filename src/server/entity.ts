import { Vec2 } from '../shared/engine/math'
import { NetworkState } from '../shared/game/network-state'

export class Entity {
  private readonly networkState: NetworkState
  private readonly id: string
  private readonly kind: string
  private readonly position: Vec2
  private readonly moveTarget: Vec2
  constructor(networkState: NetworkState, id: string, kind: string, position: Vec2) {
    this.networkState = networkState
    this.id = id
    this.kind = kind
    this.position = position.copy()
    this.moveTarget = this.position.copy()
  }
  tick() {
    this.tickMovement()
  }
  tickMovement() {
    const difference = this.position.differenceTo(this.moveTarget)
    const magnitude = difference.magnitude()
    const speed = 50
    const tickMovementDistance = speed / this.networkState.getServerTickRate()
    const movement = magnitude < tickMovementDistance ? difference : difference.normalized().scale(tickMovementDistance)
    this.position.x += movement.x
    this.position.y += movement.y
    this.networkState.setEntityPosition(this.id, this.position.x, this.position.y)
  }
  setMoveTarget(target: Vec2) {
    this.moveTarget.x = target.x
    this.moveTarget.y = target.y
  }
}
