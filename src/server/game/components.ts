import { Vec2 } from '../../shared/engine/math'
import { TaggedComponent } from '../engine/ecs'
import { Entity } from './server-state'

export const components = ['Position', 'Identity', 'Team', 'Senses'] as const
export type ComponentTags = {
  Position: Position
  Identity: Identity
  Team: Team
  Senses: Senses
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
  getNetworkStateRepresentation() {
    return {
      displayName: this.displayName,
      description: this.description,
    }
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
      position: this.position,
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

export class Team extends TaggedComponent<ComponentTags, Components>('Team') {
  private readonly team: number
  constructor(team: number) {
    super()
    this.team = team
  }
  getTeam(): number {
    return this.team
  }
  getNetworkStateRepresentation() {
    return {
      team: this.team,
    }
  }
}

type SenseKind = 'Range'
export class Senses extends TaggedComponent<ComponentTags, Components>('Senses') {
  private readonly senses: SenseKind[] = []
  private readonly range: number
  constructor(senses: SenseKind[], range: number) {
    super()
    this.senses = senses
    this.range = range
  }
  senseEntities(entities: Entity[]): Entity[] {
    const positionComponent = this.entity.getComponent('Position')
    const positionSelf = positionComponent.getPosition()
    return entities
      .filter(entity => {
        const position = entity.getComponent('Position')?.getPosition()
        if (!position) return false
        const distance = positionSelf.distanceTo(position)
        if (distance > this.range) return false
        return true
      })
      .sort((a: Entity, b: Entity) => {
        const selfToA = positionSelf.squareDistanceTo(a.getComponent('Position')?.getPosition())
        const selfToB = positionSelf.squareDistanceTo(b.getComponent('Position')?.getPosition())
        return selfToA - selfToB
      })
  }
  getNetworkStateRepresentation() {}
}
