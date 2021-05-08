import * as PIXI from 'pixi.js'
import { COLORS, ColorsTag } from './constants'

export function createRect(
  x: number,
  y: number,
  dx: number,
  dy: number,
  options?: {
    colorName?: ColorsTag
    color?: number
    anchor?: 'center' | 'top-left'
  },
) {
  const _options = Object.assign(
    {},
    {
      colorName: undefined,
      color: 0x888888,
      anchor: 'center',
    },
    options,
  )
  const rect = new PIXI.Graphics()
  const color = (COLORS as any)[_options.colorName!]
  rect.beginFill(color ? color : _options.color)
  if (_options.anchor === 'center') {
    rect.drawRect(-dx / 2, -dy / 2, dx, dy)
  } else if (_options.anchor === 'top-left') {
    rect.drawRect(0, 0, dx, dy)
  }
  rect.endFill()
  rect.x = x
  rect.y = y
  return rect
}
