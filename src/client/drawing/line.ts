import * as PIXI from 'pixi.js'

const DEFAULT_FILL_COLOR = 0xeeeeee

export function addLine(app: PIXI.Application, x0: number, y0: number, x: number, y: number, width: number = 2, color: number = DEFAULT_FILL_COLOR, alpha: number = 1) {
  const line = new PIXI.Graphics()
  line.lineStyle(width, color, alpha)
  line.moveTo(0, 0)
  line.lineTo(x, y)
  line.x = x0
  line.y = y0
  app.stage.addChild(line)
  return line
}
