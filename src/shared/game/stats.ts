export const Stats = {
  Entities: {
    Pawn: {
      speed: 50,
    },
  },
  Items: {
    WEAPON_WIN1906: {
      displayName: 'Winchester 1906 .22',
      barrelLength: 0.508,
    },
    AMMO_22_SHORT: {
      displayName: '.22 Short',
      mass: 0.0019,
      velocityMin: 175,
      velocityMax: 400,
      barrelLengthMin: 0.08,
      barrelLengthMax: 0.62,
    },
    BODY_HEAD_BOONIE: {
      displayName: 'Boonie Hat',
      protectionMelee: 0.01,
    },
  },
  Basic: {
    FISTS: {
      keneticEnergy: 0,
    },
  },
  Abilities: {
    Movement: {

    }
  }
}

export type EntityTag = keyof typeof Stats.Entities
export type ItemTag = keyof typeof Stats.Items
export type BasicTag = keyof typeof Stats.Basic
export type AbilityTag = keyof typeof Stats.Abilities
