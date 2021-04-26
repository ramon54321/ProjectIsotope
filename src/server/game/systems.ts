import { System as ECSSystem } from '../engine/ecs'
import { Components, ComponentTags } from './components'
import { Entity } from './server-state'

abstract class System extends ECSSystem<ComponentTags, Components> {}

export class Movement extends System {
  private static readonly MOVEMENT_NULL_ZONE = 2
  protected readonly dependentComponentTags = ['Position'] as const
  onTick(entity: Entity) {
    const positionComponent = entity.getComponent('Position')
    const position = positionComponent.getPosition()
    const targetPosition = positionComponent.getTargetPosition()
    const difference = position.differenceTo(targetPosition)
    const magnitude = difference.magnitude()
    const speed = 50
    const tickMovementDistance = speed / this.networkState.getServerTickRate()
    const movement = magnitude < tickMovementDistance ? difference : difference.normalized().scale(tickMovementDistance)
    if (magnitude >= Movement.MOVEMENT_NULL_ZONE) {
      const x = position.x + movement.x
      const y = position.y + movement.y
      positionComponent.setPosition(x, y)
      positionComponent.updateNetworkState()
      // this.networkState.setEntityPosition(entity.id, x, y)
    }
  }
}
