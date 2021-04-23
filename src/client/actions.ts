import { Vec2 } from '../shared/engine/math'
import { NetClient } from '../shared/engine/networking'

export class Actions {
  private readonly network: NetClient
  constructor(network: NetClient) {
    this.network = network
  }
  private sendAction(payload: any) {
    const message = {
      tag: 'action',
      payload: payload,
    }
    this.network.emitOnServer(message)
  }
  moveEntity(id: string, target: Vec2) {
    this.sendAction({
      action: 'move',
      entityId: id,
      target: target,
    })
  }
}
