import { Vec2 } from '../../shared/engine/math'
import { Combat, Dimension, Health, Identity, Inventory, Movement, Position, Senses, Team } from './components'
import { ECS } from './server-state'

export const Library = {
  Entities: {
    Dummy: {
      constructor: (ecs: ECS, options: any) => {
        const position = options.position || new Vec2(0, 0)
        return ecs
          .createEntity()
          .addComponent(new Position(position.x, position.y))
          .addComponent(new Identity('Dummy', 'A generic dummy entity, generally used for testing purposes.'))
      },
    },
    Pawn: {
      constructor: (ecs: ECS, options: any) => {
        const position = options.position || new Vec2(0, 0)
        const team = options.team || 0
        return ecs
          .createEntity()
          .addComponent(new Position(position.x, position.y))
          .addComponent(new Movement(50))
          .addComponent(new Identity('Pawn', 'A simple pawn which belongs to a team.'))
          .addComponent(new Team(team))
          .addComponent(new Senses(['Range'], 100))
          .addComponent(new Inventory())
          .addComponent(new Health())
          .addComponent(new Combat())
      },
    },
    BUILDING_SETTLEMENT: {
      constructor: (ecs: ECS, options: any) => {
        const position = options.position || new Vec2(0, 0)
        const team = options.team || 0
        return ecs
          .createEntity()
          .addComponent(new Position(position.x, position.y))
          .addComponent(new Identity('Settlement', 'The main center building of a colony.'))
          .addComponent(new Team(team))
          .addComponent(new Dimension(30, 60))
          .addComponent(new Senses(['Range'], 100))
          .addComponent(new Inventory())
          .addComponent(new Health())
      },
    },
  },
}
