import { Vec2 } from '../shared/engine/math'
import { NetClient } from '../shared/engine/networking'
import { NSEntity } from '../shared/game/network-state'

export interface UIState {
  mouseScreenPosition: Vec2
  mouseWorldPosition: Vec2
  selectedEntity: NSEntity
  hoverEntity: NSEntity
}

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
  moveEntity(uiState: UIState, options?: any) {
    if (uiState.selectedEntity.id === undefined) return
    this.sendAction({
      action: 'move',
      entityId: uiState.selectedEntity.id,
      target: uiState.mouseWorldPosition,
      ...options,
    })
  }
  spawnEntity(uiState: UIState, options?: any) {
    this.sendAction({
      action: 'spawn',
      position: uiState.mouseWorldPosition,
      kind: options?.kind || 'unknown',
      ...options,
    })
  }
  addItem(uiState: UIState, options?: any) {
    if (uiState.hoverEntity.id === undefined) return
    this.sendAction({
      action: 'add_item',
      entityId: uiState.hoverEntity.id,
      kind: options?.kind || 'unknown',
      ...options,
    })
  }
}
