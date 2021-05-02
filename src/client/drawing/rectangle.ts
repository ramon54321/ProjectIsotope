import * as PIXI from 'pixi.js'
import { COLORS } from './constants'

const DEFAULT_FILL_COLOR = 0x111111

export function addRect(app: PIXI.Application, x: number, y: number, dx: number, dy: number, colorName?: string) {
  const rect = new PIXI.Graphics()
  const color = (COLORS as any)[colorName!]
  rect.beginFill(color !== undefined ? color : DEFAULT_FILL_COLOR)
  rect.drawRect(-dx / 2, -dy / 2, dx, dy)
  rect.endFill()
  rect.x = x
  rect.y = y
  app.stage.addChild(rect)
  return rect
}
