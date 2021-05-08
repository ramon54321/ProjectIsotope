import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { NSEntity } from '../shared/game/network-state'
import { createText } from './drawing/text'
import { Gtx } from './graphics'
import { PawnSprite, SpriteUtils } from './sprite-utils'

export class SpriteLibrary {
  static getPawnSprite(gtx: Gtx, entity: NSEntity): PawnSprite {
    const simpleKinds = ['Dummy']
    const team = entity.components.get('Team')?.team
    const colorName = gtx.networkState.getTeams()[team]

    const body = SpriteUtils.createSprite(gtx.app, 'biped1', 'template_biped_body', { scale: new Vec2(0.5, 0.5) }) as PawnSprite
    const head = SpriteUtils.createSprite(gtx.app, 'biped1', 'template_biped_head')
    body.addChild(head)
    head.position.set(-16, -32)
    gtx.app.stage.addChild(body)

    const displayNameText = entity.components.get('Identity')?.displayName
    if (displayNameText !== undefined) {
      const displayName = createText(displayNameText, 0, 32, { colorName: 'UserInterfaceText', fontSize: 20, anchor: new Vec2(0.5, 0) })
      body.addChild(displayName)
    }

    return this.setupPawn(gtx, body, entity)
  }
  private static setupPawn(gtx: Gtx, sprite: PIXI.Sprite, entity: NSEntity): PawnSprite {
    sprite.interactive = true
    sprite.on('mouseup', () => gtx.selection.setSelectedEntity(entity))
    sprite.on('mouseover', () => gtx.selection.setHoverEntity(entity))
    const position = entity.components.get('Position').position
    sprite.position.set(position.x, position.y)
    ;(sprite as any).lastPosition = new Vec2(sprite.position.x, sprite.position.y)
    ;(sprite as any).velocity = new Vec2(0, 0)
    return sprite as PawnSprite
  }
}
