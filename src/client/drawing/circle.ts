import * as PIXI from 'pixi.js'

const DEFAULT_FILL_COLOR = 0xeeeeee

export function addCircle(app: PIXI.Application, x: number, y: number, radius: number) {
  const circle = new PIXI.Graphics()
  circle.beginFill(DEFAULT_FILL_COLOR)
  circle.drawCircle(0, 0, radius)
  circle.endFill()
  circle.x = x
  circle.y = y
  app.stage.addChild(circle)
  return circle
}
