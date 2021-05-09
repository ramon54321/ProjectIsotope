import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import gen from 'random-seed'

const R = gen.create('12345')

export interface PawnSprite extends PIXI.Sprite {
  lastPosition: Vec2
  velocity: Vec2
}

export class SpriteUtils {
  static createSprite(
    app: PIXI.Application,
    spritesheet: string,
    texture: string | undefined,
    options?: {
      extension?: string
      resourcesDir?: string
      scale?: Vec2
      anchor?: Vec2
    },
  ): PIXI.Sprite {
    const _options = Object.assign(
      {},
      {
        extension: 'png',
        resourcesDir: 'res/',
        scale: new Vec2(1, 1),
        anchor: new Vec2(0.5, 0.5),
      },
      options,
    )
    const textures = app.loader.resources[`${_options.resourcesDir}${spritesheet}/${spritesheet}.json`].textures!
    const textureName = texture
      ? `${texture}.${_options.extension}`
      : `${spritesheet}_${R.range(Object.keys(textures).length)}.${_options.extension}`
    const sprite = new PIXI.Sprite(textures[textureName])
    sprite.anchor.set(_options.anchor.x, _options.anchor.y)
    sprite.scale.set(_options.scale.x, _options.scale.y)
    return sprite
  }
}
