import EventEmitter from 'events'
import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { addMenu } from './drawing/menu'

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
  toggle(screenPosition: Vec2) {
    if (this.container) return this.close()
    this.spawn(screenPosition)
  }
  private spawn(screenPosition: Vec2) {
    this.container = addMenu(
      this.app,
      [
        {
          text: 'Hello',
          action: () => console.log('Clicked Hello'),
        },
        {
          text: 'World',
          action: () => console.log('Clicked world'),
        },
      ],
      screenPosition.x,
      screenPosition.y,
      () => this.close(),
    )
  }
}
