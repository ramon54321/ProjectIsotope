import * as PIXI from 'pixi.js'
import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { ActiveTotal, Gtx } from './graphics'
import { QuadTree, AABB } from './quadtree'
import { SpriteLibrary } from './sprite-library'

export class FixtureManager implements ActiveTotal {
  private readonly gtx: Gtx
  private readonly camera: Camera
  constructor(gtx: Gtx, camera: Camera) {
    this.gtx = gtx
    this.camera = camera
    setInterval(() => this.slowTick(), 200)
  }
  getActiveCount(): number {
    return this.lastSet.length
  }
  getTotalCount(): number {
    return this.quadTree.count()
  }
  private lastSet: [string, PIXI.Sprite][] = []
  private readonly quadTree = new QuadTree<PIXI.Sprite>(new AABB(0, 0, 5000))
  private slowTick() {
    const cameraPosition = this.camera.getPosition()
    const cameraArea = new AABB(cameraPosition.x, cameraPosition.y, this.gtx.app.renderer.width)
    this.lastSet.forEach(([id, sprite]) => (sprite.visible = false))
    const sprites = this.quadTree.query(cameraArea)
    sprites.forEach(([id, sprite]) => (sprite.visible = true))
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
    this.quadTree.query(this.quadTree.boundary).forEach(([id, sprite]) => this.destroyFixture(id, sprite))
    this.gtx.networkState.getFixtures().forEach(fixture => this.createFixture(fixture.id))
  }
  private createFixture(id: string) {
    const fixture = this.gtx.networkState.getFixture(id)
    if (fixture === undefined) return
    const sprite = SpriteLibrary.getFixtureSprite(this.gtx, fixture)
    this.gtx.renderLayers.addSprite(sprite, 'Fixtures')
    this.quadTree.add(fixture.position, id, sprite)
    sprite.visible = false
  }
  private destroyFixture(id: string, sprite?: PIXI.Sprite) {
    const _sprite = sprite ? sprite : this.quadTree.get(id)
    if (_sprite === undefined) return
    this.gtx.renderLayers.removeSprite(_sprite, 'Fixtures')
    this.quadTree.remove(id)
    _sprite.destroy()
  }
  protected render(deltaTimeSeconds: number) {}
}
