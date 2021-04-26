import { Vec2 } from '../../shared/engine/math'
import { TaggedComponent } from '../engine/ecs'

export const components = ['Position', 'Identity'] as const
export type ComponentTags = {
  Position: Position
  Identity: Identity
}
export type Components = typeof components[number]

export class Identity extends TaggedComponent<ComponentTags, Components>('Identity') {
  private readonly displayName: string
  private readonly description: string
  constructor(displayName: string, description: string) {
    super()
    this.displayName = displayName
    this.description = description
  }
}
export class Position extends TaggedComponent<ComponentTags, Components>('Position') {
  private readonly position = new Vec2(0, 0)
  private readonly targetPosition = new Vec2(0, 0)
  constructor(x: number, y: number) {
    super()
    this.position.x = x
    this.position.y = y
    this.targetPosition.x = x
    this.targetPosition.y = y
  }
  getNetworkStateRepresentation() {
    return {
      position: this.position
    }
  }
  getPosition(): Vec2 {
    return this.position
  }
  setPosition(x: number, y: number) {
    this.position.x = x
    this.position.y = y
  }
  getTargetPosition(): Vec2 {
    return this.targetPosition
  }
  setTargetPosition(x: number, y: number) {
    this.targetPosition.x = x
    this.targetPosition.y = y
  }
}
