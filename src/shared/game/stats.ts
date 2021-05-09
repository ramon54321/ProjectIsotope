export const Stats = {
  Entities: {
    Pawn: {
      displayName: 'Simple Pawn',
      speed: 50,
      productionSeconds: 8,
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
  Instants: {
    ATTACK_BULLET_LIGHT: {
      durationSeconds: 1
    }
  },
  Fixtures: {
    PATCH_L_0: {
      
    }
  }
}

export type EntityTag = keyof typeof Stats.Entities
export type ItemTag = keyof typeof Stats.Items
export type BasicTag = keyof typeof Stats.Basic
export type InstantsTag = keyof typeof Stats.Instants
export type FixturesTag = keyof typeof Stats.Fixtures
