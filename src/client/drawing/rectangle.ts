import * as PIXI from 'pixi.js'

const DEFAULT_FILL_COLOR = 0x111111

export function addRect(app: PIXI.Application, x: number, y: number, dx: number, dy: number, color: number = DEFAULT_FILL_COLOR) {
  const rect = new PIXI.Graphics()
  rect.beginFill(color)
  rect.drawRect(-dx / 2, -dy / 2, dx, dy)
  rect.endFill()
  rect.x = x
  rect.y = y
  app.stage.addChild(rect)
  return rect
}
