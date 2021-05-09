import EventEmitter from 'events'
import * as PIXI from 'pixi.js'
import { UIState } from './actions'
import { Gtx } from './graphics'
import { addMenu } from './drawing/menu'

export type MenuItem = {
  text: string
  action: (uiState: UIState) => void
}

export class Interaction {
  private readonly gtx: Gtx
  private menuContainer: PIXI.Container | undefined
  private readonly events = new EventEmitter()
  constructor(gtx: Gtx) {
    this.gtx = gtx
    gtx.renderLayers.getRenderLayer('Background').on('mouseup', () => this.close())
  }
  getEventEmitter(): EventEmitter {
    return this.events
  }
  close() {
    if (!this.menuContainer) return
    this.gtx.renderLayers.removeSprite(this.menuContainer, 'UI')
    this.menuContainer = undefined
  }
  push(uiState: UIState, items: MenuItem[]) {
    if (this.menuContainer) this.close()
    setTimeout(() => this.spawn(uiState, items), 10)
  }
  toggle(uiState: UIState, items: MenuItem[]) {
    if (this.menuContainer) return this.close()
    this.spawn(uiState, items)
  }
  private spawn(uiState: UIState, items: MenuItem[]) {
    this.menuContainer = addMenu(
      items,
      uiState.mouseScreenPosition.x,
      uiState.mouseScreenPosition.y,
      item => item.action(uiState),
      () => this.close(),
    )
    this.gtx.renderLayers.addSprite(this.menuContainer, 'UI')
  }
}
