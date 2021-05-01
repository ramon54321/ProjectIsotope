import EventEmitter from 'events'
import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { UIState } from './actions'
import { addMenu } from './drawing/menu'

export type MenuItem = {
  text: string
  action: (uiState: UIState) => void
}

export class Interaction {
  private readonly app: PIXI.Application
  private container: PIXI.Container | undefined
  private readonly events = new EventEmitter()
  constructor(app: PIXI.Application) {
    this.app = app
  }
  getEventEmitter(): EventEmitter {
    return this.events
  }
  close() {
    if (!this.container) return
    this.app.stage.removeChild(this.container)
    this.container = undefined
  }
  toggle(screenPosition: Vec2, uiState: UIState, items: MenuItem[]) {
    if (this.container) return this.close()
    this.spawn(screenPosition, uiState, items)
  }
  private spawn(screenPosition: Vec2, uiState: UIState, items: MenuItem[]) {
    this.container = addMenu(
      this.app,
      items,
      screenPosition.x,
      screenPosition.y,
      item => item.action(uiState),
      () => this.close(),
    )
  }
}
