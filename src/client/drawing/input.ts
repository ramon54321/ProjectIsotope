import * as PIXI from 'pixi.js'
import { Vec2 } from '../../shared/engine/math'
import { HALF_HEIGHT, HALF_WIDTH } from './constants'

export class Input {
  private readonly inputDown: any = {}
  private readonly inputOnce: any = {}
  constructor() {
    this.inputDown = {}
    this.inputOnce = {}
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.inputDown[e.key] = true
      this.inputOnce[e.key] = true
    })
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.inputDown[e.key] = false
    })
    window.addEventListener('mousedown', (e: MouseEvent) => {
      this.inputDown['click'] = true
      this.inputOnce['click'] = true
    })
    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.inputDown['click'] = false
    })
  }
  reset() {
    for (const key in this.inputOnce) {
      this.inputOnce[key] = false
    }
  }
  getInputDown(key: string) {
    return this.inputDown[key]
  }
  getInputOnce(key: string) {
    return this.inputOnce[key]
  }
  getMouseWorldPosition(app: PIXI.Application, cameraPosition: Vec2): Vec2 {
    const rawPosition = app.renderer.plugins.interaction.mouse.global
    const x = rawPosition.x + cameraPosition.x - HALF_WIDTH
    const y = rawPosition.y + cameraPosition.y - HALF_HEIGHT
    return new Vec2(x, y)
  }
}
