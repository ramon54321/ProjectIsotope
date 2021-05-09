import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { SpriteLibrary } from './sprite-library'
import { SpriteManager } from './sprite-manager'

export class FixtureManager extends SpriteManager<any> {
  constructor(gtx: Gtx, camera: Camera) {
    super(gtx, camera, 'Fixtures', 2, 2, 400, 400)
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
    this.sprites.forEach((sprite, id) => this.destroyFixture(id))
    this.gtx.networkState.getFixtures().forEach(fixture => this.createFixture(fixture.id))
  }
  private createFixture(id: string) {
    const fixture = this.gtx.networkState.getFixture(id)
    if (fixture === undefined) return
    const sprite = SpriteLibrary.getFixtureSprite(this.gtx, fixture)
    this.addSprite(sprite)
    this.sprites.set(id, sprite)
  }
  private destroyFixture(id: string) {
    const sprite = this.sprites.get(id)
    if (sprite === undefined) return
    this.removeSprite(sprite)
    this.sprites.delete(id)
    sprite.destroy()
  }
  protected render(deltaTimeSeconds: number) {}
}
