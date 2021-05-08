import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'

export interface PawnSprite extends PIXI.Sprite {
  lastPosition: Vec2
  velocity: Vec2
}

export class SpriteUtils {
  static createSprite(
    app: PIXI.Application,
    spritesheet: string,
    texture: string,
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
    const sprite = new PIXI.Sprite(
      app.loader.resources[`${_options.resourcesDir}${spritesheet}.json`].textures![`${texture}.${_options.extension}`],
    )
    sprite.anchor.set(_options.anchor.x, _options.anchor.y)
    sprite.scale.set(_options.scale.x, _options.scale.y)
    return sprite
  }
}
