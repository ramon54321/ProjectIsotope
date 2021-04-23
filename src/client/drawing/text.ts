import EventEmitter from 'events'
import * as PIXI from 'pixi.js'

const FONT_SIZE = 10
const TEXT_STYLE = new PIXI.TextStyle({
  fontSize: FONT_SIZE,
  fill: 0xeeeeee,
})

export function addText(app: PIXI.Application, text: string, x: number, y: number, anchorX: number = 0.5) {
  const message = new PIXI.Text(text, TEXT_STYLE)
  message.anchor.set(anchorX, 0.5)
  message.x = x
  message.y = y
  message.interactive = true
  // message.on('mousedown', )
  app.stage.addChild(message)
  return message
}

export function addTextLive(
  app: PIXI.Application,
  eventEmitter: EventEmitter,
  event: string,
  update: () => string,
  x: number,
  y: number,
  anchorX: number = 0.5,
) {
  const message = addText(app, update(), x, y, anchorX)
  eventEmitter.on(event, () => (message.text = update()))
  return message
}
