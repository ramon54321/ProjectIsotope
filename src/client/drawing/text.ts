import * as PIXI from 'pixi.js'
import { Vec2 } from '../../shared/engine/math'
import { COLORS, ColorsTag } from './constants'

export function createText(
  text: string,
  x: number,
  y: number,
  options?: {
    anchor?: Vec2
    colorName?: ColorsTag
    color?: number
    align?: 'left' | 'center' | 'right' | 'justify'
    fontSize?: number
  },
) {
  const _options = Object.assign(
    {},
    {
      anchor: new Vec2(0.5, 0.5),
      colorName: undefined,
      color: 0xeeeeee,
      align: 'center',
      fontSize: 10,
    },
    options,
  )
  const _color = (COLORS as any)[_options.colorName!]
  const textStyle = new PIXI.TextStyle({
    fontSize: _options.fontSize,
    fill: _color ? _color : _options.color,
    align: _options.align,
  })
  const message = new PIXI.Text(text, textStyle)
  message.anchor.set(_options.anchor.x, _options.anchor.y)
  message.x = x
  message.y = y
  return message
}
