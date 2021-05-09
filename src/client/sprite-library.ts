import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { NSEntity, NSFixture } from '../shared/game/network-state'
import { createText } from './drawing/text'
import { Gtx } from './graphics'
import { PawnSprite, SpriteUtils } from './sprite-utils'
import gen from 'random-seed'

const R = gen.create('12345')

export class SpriteLibrary {
  static getFixtureSprite(gtx: Gtx, fixture: NSFixture): PIXI.Sprite {
    if (fixture.kind === 'PATCH_L_0') {
      const sprite = SpriteUtils.createSprite(gtx.app, 'PATCH_L_A', undefined, { scale: new Vec2(0.5 * fixture.scale, 0.5 * fixture.scale) })
      sprite.tint = R.random() > 0.5 ? 0xf0d269 : 0xc9b779
      sprite.position.set(fixture.position.x, fixture.position.y)
      sprite.rotation = fixture.rotation
      sprite.interactive = false
      return sprite
    } else {
      const sprite = SpriteUtils.createSprite(gtx.app, 'GRASS_S_A', undefined, { scale: new Vec2(0.5 * fixture.scale, 0.5 * fixture.scale) })
      sprite.tint = R.random() > 0.5 ? 0xEEB977 : 0xFFDFB2
      sprite.position.set(fixture.position.x, fixture.position.y)
      sprite.rotation = fixture.rotation
      sprite.interactive = false
      return sprite
    }
  }
  static getPawnSprite(gtx: Gtx, entity: NSEntity): PawnSprite {
    const simpleKinds = ['Dummy']
    const team = entity.components.get('Team')?.team
    const colorName = gtx.networkState.getTeams()[team]

    const body = SpriteUtils.createSprite(gtx.app, 'BIPED_A', 'BIPED_A_BODY', { scale: new Vec2(0.5, 0.5) }) as PawnSprite
    const head = SpriteUtils.createSprite(gtx.app, 'BIPED_A', 'BIPED_A_HEAD')
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
