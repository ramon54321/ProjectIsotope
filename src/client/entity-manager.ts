import { Vec2 } from '../shared/engine/math'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { SpriteLibrary } from './sprite-library'
import { SpriteManager } from './sprite-manager'
import { PawnSprite } from './sprite-utils'

export class EntityManager extends SpriteManager<PawnSprite> {
  constructor(gtx: Gtx, camera: Camera) {
    super(gtx, camera, 'Entities')
  }
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
  private reload() {
    this.sprites.forEach((sprite, id) => this.destroyEntity(id))
    this.gtx.networkState.getEntities().forEach(entity => this.createEntity(entity.id))
  }
  private createEntity(id: string) {
    const entity = this.gtx.networkState.getEntity(id)
    if (entity === undefined) return
    const sprite = SpriteLibrary.getPawnSprite(this.gtx, entity)
    this.addSprite(sprite)
    this.sprites.set(id, sprite)
  }
  private destroyEntity(id: string) {
    const sprite = this.sprites.get(id)
    if (sprite === undefined) return
    this.removeSprite(sprite)
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

      // Position
      const movement = sprite.velocity.scale(tickInterpolation)
      const position = new Vec2(sprite.lastPosition.x + movement.x, sprite.lastPosition.y + movement.y)
      sprite.position.set(position.x, position.y)

      // Sorting
      sprite.zIndex = sprite.position.y
    })
  }
}
