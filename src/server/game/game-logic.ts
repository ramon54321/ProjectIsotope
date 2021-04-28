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
  tickSlow() {
    this.serverState.tickSlowEcs()
  }
  private tickActions() {
    let actionPayload = this.actionPayloadQueue.shift()
    while (actionPayload) {
      if (actionPayload.action === 'move') {
        this.serverState.setEntityMoveTarget(actionPayload.entityId, actionPayload.target)
      } else if (actionPayload.action === 'spawn') {
        this.serverState.createEntity(actionPayload.kind, actionPayload)
      } else if (actionPayload.action === 'add_item') {
        this.serverState.addItem(actionPayload.entityId, actionPayload.kind, actionPayload)
      }
      actionPayload = this.actionPayloadQueue.shift()
    }
  }
}
