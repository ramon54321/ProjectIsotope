import * as PIXI from 'pixi.js'
import { COLORS, ColorsTag } from './constants'

export function createLine(
  x0: number,
  y0: number,
  x: number,
  y: number,
  options?: {
    colorName?: ColorsTag
    color?: number
    alpha?: number
    width?: number
  },
) {
  const _options = Object.assign(
    {},
    {
      colorName: undefined,
      color: 0xff8888,
      alpha: 1,
      width: 2,
    },
    options,
  )
  const color = (COLORS as any)[_options.colorName!]
  const line = new PIXI.Graphics()
  line.lineStyle(_options.width, color ? color : _options.color, _options.alpha)
  line.moveTo(0, 0)
  line.lineTo(x, y)
  line.x = x0
  line.y = y0
  return line
}
