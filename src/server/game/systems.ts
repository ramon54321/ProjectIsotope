import { Stats } from '../../shared/game/stats'
import { System as ECSSystem } from '../engine/ecs'
import { Components, ComponentTags } from './components'
import { Entity } from './server-state'

abstract class System extends ECSSystem<ComponentTags, Components> {}

export class Movement extends System {
  private static readonly MOVEMENT_NULL_ZONE = 2
  protected readonly dependentComponentTags = ['Position'] as const
  onTick(entitySelf: Entity) {
    const positionComponent = entitySelf.getComponent('Position')
    const position = positionComponent.getPosition()
    const targetPosition = positionComponent.getTargetPosition()
    const difference = position.differenceTo(targetPosition)
    const magnitude = difference.magnitude()
    const speed = Stats.Entities.Pawn.speed
    const tickMovementDistance = speed / this.networkState.getServerTickRate()
    const movement = magnitude < tickMovementDistance ? difference : difference.normalized().scale(tickMovementDistance)
    if (magnitude >= Movement.MOVEMENT_NULL_ZONE) {
      const x = position.x + movement.x
      const y = position.y + movement.y
      positionComponent.setPosition(x, y)
      positionComponent.updateNetworkState()
    }
  }
  onTickSlow(entitySelf: Entity) {}
}

export class Reaction extends System {
  protected readonly dependentComponentTags = ['Position', 'Senses', 'Team'] as const
  onTick(entitySelf: Entity) {}
  onTickSlow(entitySelf: Entity) {
    const sensesComponent = entitySelf.getComponent('Senses')
    const entities = sensesComponent.senseEntities(this.ecs.getEntities())
    const teamSelf = entitySelf.getComponent('Team')?.getTeam()
    const reactionEntity = entities.find(entity => {
      const team = entity.getComponent('Team')?.getTeam()
      if (team === undefined) return false
      if (team === teamSelf) return false
      return true
    })
    if (!reactionEntity) return
    console.log(entitySelf.id, 'responding to sensed opponent', reactionEntity.id)
    const combatComponent = entitySelf.getComponent('Combat')
    if (!combatComponent) return
    combatComponent.engage(reactionEntity)
  }
}

export class Combat extends System {
  protected readonly dependentComponentTags = ['Combat'] as const
  onTick(entitySelf: Entity) {
    const combatComponent = entitySelf.getComponent('Combat')
    combatComponent.tick()
  }
  onTickSlow(entitySelf: Entity) {
    const combatComponent = entitySelf.getComponent('Combat')
    combatComponent.tickSlow()
  }
}
