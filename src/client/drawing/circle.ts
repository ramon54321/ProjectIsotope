import * as PIXI from 'pixi.js'
import { COLORS } from './constants'

const DEFAULT_FILL_COLOR = 0xeeeeee

export function addCircle(app: PIXI.Application, x: number, y: number, radius: number, colorName?: string) {
  const circle = new PIXI.Graphics()
  const color = (COLORS as any)[colorName!]
  circle.beginFill(color !== undefined ? color : DEFAULT_FILL_COLOR)
  circle.drawCircle(0, 0, radius)
  circle.endFill()
  circle.x = x
  circle.y = y
  app.stage.addChild(circle)
  return circle
}
