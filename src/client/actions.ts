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
  moveEntity(id: string | undefined, target: Vec2) {
    if (id === undefined) return
    this.sendAction({
      action: 'move',
      entityId: id,
      target: target,
    })
  }
  spawnEntity(position: Vec2, kind: string, options?: any) {
    this.sendAction({
      action: 'spawn',
      position: position,
      kind: kind,
      ...options,
    })
  }
}
