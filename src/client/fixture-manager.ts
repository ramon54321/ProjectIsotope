import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { QuadTree, AABB } from './quadtree'
import { SpriteLibrary } from './sprite-library'

export class FixtureManager {
  private readonly gtx: Gtx
  private readonly camera: Camera
  constructor(gtx: Gtx, camera: Camera) {
    this.gtx = gtx
    this.camera = camera
    setInterval(() => this.slowTick(), 200)
  }
  getActiveSmall(): number {
    return this.lastActiveSmall
  }
  getTotalSmall(): number {
    return this.lastTotalSmall
  }
  getActiveLarge(): number {
    return this.lastActiveLarge
  }
  getTotalLarge(): number {
    return this.lastTotalLarge
  }
  private lastSet: [string, PIXI.Sprite][] = []
  private lastTotalSmall: number = 0
  private lastTotalLarge: number = 0
  private lastActiveSmall: number = 0
  private lastActiveLarge: number = 0
  private readonly quadTreeSmall = new QuadTree<PIXI.Sprite>(new AABB(0, 0, 5000))
  private readonly quadTreeLarge = new QuadTree<PIXI.Sprite>(new AABB(0, 0, 5000))
  private slowTick() {
    const cameraPosition = this.camera.getPosition()
    const cameraAreaSmall = new AABB(cameraPosition.x, cameraPosition.y, this.gtx.app.renderer.width / 3.2)
    const cameraAreaLarge = new AABB(cameraPosition.x, cameraPosition.y, this.gtx.app.renderer.width)
    this.lastSet.forEach(([id, sprite]) => (sprite.visible = false))
    const spritesSmall = this.quadTreeSmall.query(cameraAreaSmall)
    const spritesLarge = this.quadTreeLarge.query(cameraAreaLarge)
    const sprites = spritesSmall.concat(spritesLarge)
    sprites.forEach(([id, sprite]) => (sprite.visible = true))
    this.lastActiveSmall = spritesSmall.length
    this.lastActiveLarge = spritesLarge.length
    this.lastSet = sprites
  }
  start() {
    this.gtx.events.on('state-fullState', () => this.reload())
    this.gtx.networkState.on(
      'createFixture',
      (id?: string, kind?: string, position?: Vec2, rotation?: number) => id && this.createFixture(id),
    )
    this.gtx.networkState.on('deleteFixture', (id?: string) => id && this.destroyFixture(id))
    this.reload()
  }
  private reload() {
    this.quadTreeSmall
      .query(this.quadTreeSmall.boundary)
      .concat(this.quadTreeLarge.query(this.quadTreeLarge.boundary))
      .forEach(([id, sprite]) => this.destroyFixture(id, sprite))
    this.gtx.networkState.getFixtures().forEach(fixture => this.createFixture(fixture.id))
  }
  private createFixture(id: string) {
    const fixture = this.gtx.networkState.getFixture(id)
    if (fixture === undefined) return
    const sprite = SpriteLibrary.getFixtureSprite(this.gtx, fixture)
    this.gtx.renderLayers.addSprite(sprite, 'Fixtures')
    if (fixture.scale >= 16) {
      this.quadTreeLarge.add(fixture.position, id, sprite)
      this.lastTotalLarge++
    } else {
      this.quadTreeSmall.add(fixture.position, id, sprite)
      this.lastTotalSmall++
    }
    sprite.visible = false
  }
  private destroyFixture(id: string, sprite?: PIXI.Sprite) {
    const _sprite = sprite ? sprite : this.quadTreeSmall.get(id) || this.quadTreeLarge.get(id)
    if (_sprite === undefined) return
    this.gtx.renderLayers.removeSprite(_sprite, 'Fixtures')
    if (this.quadTreeSmall.remove(id)) {
      this.lastTotalSmall--
    } else if (this.quadTreeLarge.remove(id)) {
      this.lastTotalLarge--
    } else {
      throw new Error('Tried to remove unknown fixture')
    }
    _sprite.destroy()
  }
  protected render(deltaTimeSeconds: number) {}
}
