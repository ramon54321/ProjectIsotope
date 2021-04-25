import * as PIXI from 'pixi.js'
import { MenuItem } from '../interaction'

const FONT_SIZE = 12
const TEXT_STYLE = new PIXI.TextStyle({
  fontSize: FONT_SIZE,
  fill: 0xeeeeee,
})

const BACKGROUND_COLOR = 0x888888
const BACKGROUND_ALPHA_BASE = 0.6
const BACKGROUND_ALPHA_HOVER = 0.9
const ITEM_HEIGHT = 20
const PADDING_LEFT = 10

export function addMenu(app: PIXI.Application, items: MenuItem[], x: number, y: number, itemClickCallback: (item: MenuItem) => void, afterClickCallback?: () => void) {
  const menu = new PIXI.Container()
  menu.position.x = x
  menu.position.y = y
  items.map((item, i) => {
    const y = ITEM_HEIGHT * i + ITEM_HEIGHT / 2
    const rect = new PIXI.Graphics()
    rect.beginFill(BACKGROUND_COLOR)
    rect.drawRect(0, -ITEM_HEIGHT / 2, 100, ITEM_HEIGHT)
    rect.endFill()
    rect.alpha = BACKGROUND_ALPHA_BASE
    rect.x = 0
    rect.y = y
    rect.interactive = true
    rect.on('mouseover', () => (rect.alpha = BACKGROUND_ALPHA_HOVER))
    rect.on('mouseout', () => (rect.alpha = BACKGROUND_ALPHA_BASE))
    rect.on('mouseup', () => {
      itemClickCallback(item)
      afterClickCallback?.()
    })
    const message = new PIXI.Text(item.text, TEXT_STYLE)
    message.anchor.set(0, 0.5)
    message.position.x = PADDING_LEFT
    message.position.y = 0
    rect.addChild(message)
    menu.addChild(rect)
  })
  app.stage.addChild(menu)
  return menu
}
