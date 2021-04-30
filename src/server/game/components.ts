import { Vec2 } from '../../shared/engine/math'
import { NSItem } from '../../shared/game/network-state'
import { Stats } from '../../shared/game/stats'
import { TaggedComponent } from '../engine/ecs'
import { getKeneticEnergy } from './ballistics'
import { Entity } from './server-state'
import { getItemStats } from './utils'

export const components = ['Position', 'Identity', 'Team', 'Senses', 'Inventory', 'Combat', 'Health'] as const
export type ComponentTags = {
  Position: Position
  Identity: Identity
  Team: Team
  Senses: Senses
  Inventory: Inventory
  Combat: Combat
  Health: Health
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
  isMoving(): boolean {
    return !(Math.abs(this.position.x - this.targetPosition.x) < 2 && Math.abs(this.position.y - this.targetPosition.y) < 2)
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
  canSense(entity: Entity): boolean {
    const positionComponent = this.entity.getComponent('Position')
    const positionSelf = positionComponent.getPosition()
    const distance = positionSelf.distanceTo(entity.getComponent('Position')?.getPosition())
    if (distance <= this.range) return true
    return false
  }
  getNetworkStateRepresentation() {}
}

export class Inventory extends TaggedComponent<ComponentTags, Components>('Inventory') {
  private readonly itemIds: Set<string> = new Set()
  getItemIds(): string[] {
    return Array.from(this.itemIds)
  }
  getFirstItemOfKind(kind: string): NSItem | undefined {
    return this.getItemIds()
      .map(id => this.networkState.getItem(id))
      .find(item => item?.kind === kind)
  }
  has(id: string): boolean {
    return this.itemIds.has(id)
  }
  addItem(id: string) {
    if (this.has(id)) return
    this.itemIds.add(id)
    this.updateNetworkState()
  }
  removeItem(id: string) {
    if (this.itemIds.delete(id)) {
      this.updateNetworkState()
    }
  }
  getNetworkStateRepresentation() {
    return {
      items: this.getItemIds(),
    }
  }
}

type CombatState = 'Idle' | 'Engaged'
export class Combat extends TaggedComponent<ComponentTags, Components>('Combat') {
  private state: CombatState = 'Idle'
  private engagedEntity: Entity | undefined
  engage(targetEntity: Entity) {
    if (this.engagedEntity === targetEntity) return
    if (!targetEntity.getComponent('Health')) return
    this.engagedEntity = targetEntity
    this.state = 'Engaged'
  }
  disengage() {
    this.engagedEntity = undefined
    this.state = 'Idle'
  }
  private weaponStats: any
  tickSlow() {
    this.setWeaponStats(this.findBestWeaponStats())
    this.checkForSensesDisengage()
  }
  tick() {
    if (this.state !== 'Engaged') return
    if (!this.engagedEntity) return
    if (!this.engagedEntity.getIsActive()) return this.disengage()
    if (this.weaponStats === undefined) this.setWeaponStats(this.findBestWeaponStats())
    if (!this.canAttack()) return
    this.attack()
  }
  private attack() {
    console.log('Attacking with', JSON.stringify(this.weaponStats))
    const engagedEntityHealthComponent = this.engagedEntity?.getComponent('Health')
    if (!engagedEntityHealthComponent) return this.disengage()
    const ammunition = this.entity.getComponent('Inventory').getFirstItemOfKind('AMMO_22_SHORT')
    if (!ammunition || ammunition.quantity === undefined || ammunition.quantity <= 0) return this.disengage()
    ammunition.quantity--
    this.networkState.updateItem(ammunition)
    const ammunitionStats = getItemStats(ammunition)
    const keneticEnergy = getKeneticEnergy(
      ammunitionStats.mass,
      this.weaponStats.barrelLength,
      ammunitionStats.barrelLengthMin,
      ammunitionStats.barrelLengthMax,
      ammunitionStats.velocityMin,
      ammunitionStats.velocityMax,
    )
    engagedEntityHealthComponent.takeDamage(keneticEnergy)
  }
  private canAttack(): boolean {
    const positionComponent = this.entity.getComponent('Position')
    if (!positionComponent.isMoving()) return true
    if (this.weaponStats.useWhileMoving) return true
    return false
  }
  private findBestWeaponStats(): any {
    const inventoryComponent = this.entity.getComponent('Inventory')
    if (!inventoryComponent) return Stats.BASIC.FISTS
    const weaponsStats = inventoryComponent
      .getItemIds()
      .map(id => this.networkState.getItem(id))
      .filter(item => item?.kind.startsWith('WEAPON'))
      .map(getItemStats)
    if (weaponsStats === undefined || weaponsStats.length === 0) return Stats.BASIC.FISTS
    return weaponsStats[0]
  }
  private setWeaponStats(weaponStats: any) {
    this.weaponStats = weaponStats
  }
  private checkForSensesDisengage() {
    if (!this.engagedEntity) return
    const sensesComponent = this.entity.getComponent('Senses')
    if (!sensesComponent) return
    if (sensesComponent.canSense(this.engagedEntity)) return
    this.disengage()
  }
  getNetworkStateRepresentation() {
    return {
      state: this.state,
    }
  }
}

export class Health extends TaggedComponent<ComponentTags, Components>('Health') {
  private health: number = 1
  takeDamage(keneticEnergy: number) {
    const damage = keneticEnergy / 400
    this.health -= damage
    this.checkStatus()
  }
  private checkStatus() {
    if (this.health <= 0) {
      this.serverState.deleteEntity(this.entity.id)
    }
  }
  getNetworkStateRepresentation() {
    return {
      health: this.health,
    }
  }
}
