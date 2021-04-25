import EventEmitter from 'events'
import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { addMenu } from './drawing/menu'

export type MenuItem = {
  text: string
  action: (worldPosition: Vec2) => void
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
  toggle(cameraPosition: Vec2, screenPosition: Vec2, items: MenuItem[]) {
    if (this.container) return this.close()
    const worldPosition = new Vec2(screenPosition.x - cameraPosition.x, screenPosition.y - cameraPosition.y)
    this.spawn(screenPosition, worldPosition, items)
  }
  private spawn(screenPosition: Vec2, worldPosition: Vec2, items: MenuItem[]) {
    this.container = addMenu(this.app, items, screenPosition.x, screenPosition.y, item => item.action(worldPosition), () => this.close())
  }
}
