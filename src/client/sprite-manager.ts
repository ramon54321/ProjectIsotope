import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { RenderLayerTag } from './render-layers'

export abstract class SpriteManager<T extends PIXI.Sprite> {
  protected readonly gtx: Gtx
  protected readonly camera: Camera
  private readonly renderLayer: RenderLayerTag
  private readonly chunkWidth
  private readonly chunkHeight
  private readonly chunkVisibleRangeX
  private readonly chunkVisibleRangeY
  constructor(
    gtx: Gtx,
    camera: Camera,
    renderLayer: RenderLayerTag,
    chunkXBuffer = 1,
    chunkYBuffer = 1,
    chunkWidth = 100,
    chunkHeight = 100,
  ) {
    this.gtx = gtx
    this.camera = camera
    this.renderLayer = renderLayer
    this.chunkWidth = chunkWidth
    this.chunkHeight = chunkHeight
    this.chunkVisibleRangeX = Math.ceil(this.camera.getWidth() / this.chunkWidth / 2) + chunkXBuffer
    this.chunkVisibleRangeY = Math.ceil(this.camera.getHeight() / this.chunkHeight / 2) + chunkYBuffer
    this.gtx.app.ticker.add(delta => {
      const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
      this.render(deltaTimeSeconds)
    })
    setInterval(() => this.slowTick(), 200)
  }
  private positionToChunk(position: Vec2): Vec2 {
    return new Vec2(Math.floor(position.x / this.chunkWidth), Math.floor(position.y / this.chunkHeight))
  }
  protected readonly sprites = new Map<string, T>()
  private lastActiveCount = 0
  private lastInactiveCount = 0
  private lastTotalCount = 0
  getTotalCount(): number {
    return this.lastTotalCount
  }
  getActiveCount(): number {
    return this.lastActiveCount
  }
  getInactiveCount(): number {
    return this.lastInactiveCount
  }
  protected addSprite(sprite: PIXI.Sprite) {
    this.gtx.renderLayers.addSprite(sprite, this.renderLayer)
  }
  protected removeSprite(sprite: PIXI.Sprite) {
    this.gtx.renderLayers.removeSprite(sprite, this.renderLayer)
  }
  private slowTick() {
    const cameraPosition = this.camera.getPosition()
    const cameraChunk = this.positionToChunk(cameraPosition)
    this.lastActiveCount = 0
    this.lastInactiveCount = 0
    this.lastTotalCount = 0
    this.sprites.forEach(sprite => {
      const spriteChunk = this.positionToChunk(sprite.position as any)
      this.lastTotalCount++
      if (
        spriteChunk.x <= cameraChunk.x + this.chunkVisibleRangeX &&
        spriteChunk.x >= cameraChunk.x - this.chunkVisibleRangeX &&
        spriteChunk.y <= cameraChunk.y + this.chunkVisibleRangeY &&
        spriteChunk.y >= cameraChunk.y - this.chunkVisibleRangeY
      ) {
        sprite.visible = true
        this.lastActiveCount++
      } else {
        sprite.visible = false
        this.lastInactiveCount++
      }
    })
  }
  protected abstract render(deltaTimeSeconds: number): void
}
