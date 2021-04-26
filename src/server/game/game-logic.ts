import { Vec2 } from '../../shared/engine/math'
import { ServerState } from './server-state'

export class GameLogic {
  private readonly serverState: ServerState
  private readonly actionPayloadQueue: any[] = []
  constructor(serverState: ServerState) {
    this.serverState = serverState
  }
  pushAction(action: any) {
    this.actionPayloadQueue.push(action)
  }
  tick() {
    this.tickActions()
    this.serverState.tickEcs()
  }
  tickSlow() {}
  private tickActions() {
    let actionPayload = this.actionPayloadQueue.shift()
    while (actionPayload) {
      if (actionPayload.action === 'move') {
        this.serverState.setEntityMoveTarget(actionPayload.entityId, actionPayload.target)
      } else if (actionPayload.action === 'spawn') {
        this.serverState.createEntity(actionPayload.kind, { position: new Vec2(actionPayload.position.x, actionPayload.position.y) })
      }
      actionPayload = this.actionPayloadQueue.shift()
    }
  }
}
