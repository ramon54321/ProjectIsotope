import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { SpriteLibrary } from './sprite-library'
import { PawnSprite } from './sprite-utils'

export class EntityManager {
  private readonly gtx: Gtx
  private readonly camera: Camera
  private readonly chunkWidth = 100
  private readonly chunkHeight = 100
  private readonly chunkVisibleRangeX
  private readonly chunkVisibleRangeY
  constructor(gtx: Gtx, camera: Camera) {
    this.gtx = gtx
    this.camera = camera

    this.chunkVisibleRangeX = Math.ceil((this.camera.getWidth() / this.chunkWidth) / 2) + 1
    this.chunkVisibleRangeY = Math.ceil((this.camera.getHeight() / this.chunkHeight) / 2) + 1

    this.gtx.app.ticker.add(delta => {
      const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
      this.render(deltaTimeSeconds)
    })
    setInterval(() => this.slowTick(), 200)
  }
  private positionToChunk(position: Vec2): Vec2 {
    return new Vec2(Math.floor(position.x / this.chunkWidth), Math.floor(position.y / this.chunkHeight))
  }
  private readonly sprites = new Map<string, PawnSprite>()
  private readonly entityIdCreationQueue: string[] = []
  start() {
    this.gtx.events.on('state-fullState', () => this.reload())
    this.gtx.networkState.on('createEntity', (id?: string, kind?: string) => id && this.entityIdCreationQueue.push(id))
    this.gtx.networkState.on('deleteEntity', (id?: string) => id && this.destroyEntity(id))
    this.reload()
  }
  beforeTick() {
    this.sprites.forEach((sprite: PawnSprite, id: string) => {
      const position = this.gtx.networkState.getEntityComponent(id, 'Position')?.position
      if (position === undefined) return
      sprite.lastPosition.x = position.x
      sprite.lastPosition.y = position.y
    })
  }
  afterTick() {
    this.sprites.forEach((sprite: PawnSprite, id: string) => {
      const position = this.gtx.networkState.getEntityComponent(id, 'Position')?.position
      if (position === undefined) return
      sprite.velocity = sprite.lastPosition.differenceTo(position)
    })
  }
  private slowTick() {
    const cameraPosition = this.camera.getPosition()
    const cameraChunk = this.positionToChunk(cameraPosition)
    this.sprites.forEach(sprite => {
      const spriteChunk = this.positionToChunk(sprite.position as any)
      if (
        spriteChunk.x <= cameraChunk.x + this.chunkVisibleRangeX &&
        spriteChunk.x >= cameraChunk.x - this.chunkVisibleRangeX &&
        spriteChunk.y <= cameraChunk.y + this.chunkVisibleRangeY &&
        spriteChunk.y >= cameraChunk.y - this.chunkVisibleRangeY
      ) {
        sprite.visible = true
      } else {
        sprite.visible = false
      }
    })
  }
  private reload() {
    this.sprites.forEach((sprite, id) => this.destroyEntity(id))
    this.gtx.networkState.getEntities().forEach(entity => this.createEntity(entity.id))
  }
  private createEntity(id: string) {
    const entity = this.gtx.networkState.getEntity(id)
    if (entity === undefined) return
    const sprite = SpriteLibrary.getPawnSprite(this.gtx, entity)
    this.camera.addSprite(sprite)
    this.sprites.set(id, sprite)
  }
  private destroyEntity(id: string) {
    const sprite = this.sprites.get(id)
    if (sprite === undefined) return
    this.camera.removeSprite(sprite)
    this.sprites.delete(id)
    sprite.destroy()
  }
  protected render(deltaTimeSeconds: number) {
    while (this.entityIdCreationQueue.length > 0) this.createEntity(this.entityIdCreationQueue.shift()!)
    const timeSinceLastTick = this.gtx.tickTimer.getLapTime()
    const tickInterpolation = (timeSinceLastTick * this.gtx.networkState.getServerTickRate()) / 1000
    this.gtx.networkState.getEntities().forEach(entity => {
      const sprite = this.sprites.get(entity.id)
      if (sprite === undefined) throw new Error('Graphics can not be removed... this should not be possible')
      const movement = sprite.velocity.scale(tickInterpolation)
      const position = new Vec2(sprite.lastPosition.x + movement.x, sprite.lastPosition.y + movement.y)
      sprite.position.set(position.x, position.y)
    })
  }
}
