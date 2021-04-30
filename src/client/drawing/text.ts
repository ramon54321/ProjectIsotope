import EventEmitter from 'events'
import * as PIXI from 'pixi.js'

const FONT_SIZE = 10
const TEXT_STYLE = new PIXI.TextStyle({
  fontSize: FONT_SIZE,
  fill: 0xeeeeee,
  align: 'right',
})

export function addText(app: PIXI.Application, text: string, x: number, y: number, anchorX: number = 0.5, anchorY: number = 0.5) {
  const message = new PIXI.Text(text, TEXT_STYLE)
  message.anchor.set(anchorX, anchorY)
  message.x = x
  message.y = y
  message.interactive = true
  // message.on('mousedown', )
  app.stage.addChild(message)
  return message
}

type Event = {
  emitter: EventEmitter
  event: string
}

export function addTextLive(
  app: PIXI.Application,
  updateEvents: Event[],
  update: () => string,
  x: number,
  y: number,
  anchorX: number = 0.5,
  anchorY: number = 0.5,
) {
  const message = addText(app, update(), x, y, anchorX, anchorY)
  updateEvents.forEach(updateEvent => updateEvent.emitter.on(updateEvent.event, () => (message.text = update())))
  return message
}
