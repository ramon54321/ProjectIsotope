import { Actions, UIState } from './actions'
import { Interaction, MenuItem } from './interaction'

export class Menu {
  private readonly abilityRequirementMap: any = {
    moveEntity: {
      required: ['selection'],
      unallowed: ['hoverSelf'],
    },
  }
  private getAbilityActions(uiState: UIState, actions: Actions, available: string[]): MenuItem[] {
    const actionEntity = uiState.selectedEntity || uiState.hoverEntity
    if (actionEntity) {
      return Array.from(uiState.selectedEntity.components.values())
        .map(component => component.abilities)
        .filter(abilities => abilities !== undefined)
        .reduce((acc, abilities) => abilities.concat(acc), [])
        .filter((ability: any) => {
          const abilityRequired = this.abilityRequirementMap[ability.method]?.required
          const abilityUnallowed = this.abilityRequirementMap[ability.method]?.unallowed
          if (!abilityRequired) return true
          if (!abilityUnallowed) return true
          return abilityRequired.every((x: string) => available.includes(x)) && !abilityUnallowed.some((x: string) => available.includes(x))
        })
        .map((ability: any) => ({
          text: ability.text,
          action: (uiState: UIState) => (actions as any)[ability.method]?.(uiState),
        }))
    }
    return []
  }
  noSelectionNoHover(interaction: Interaction, actions: Actions, uiState: UIState) {
    const devActions = [
      {
        text: 'Spawn Dummy',
        action: (uiState: UIState) => actions.spawnEntity(uiState, { kind: 'Pawn' }),
      },
      {
        text: 'Spawn Pawn Team 0',
        action: (uiState: UIState) => actions.spawnEntity(uiState, { kind: 'Pawn', team: 0 }),
      },
      {
        text: 'Spawn Pawn Team 1',
        action: (uiState: UIState) => actions.spawnEntity(uiState, { kind: 'Pawn', team: 1 }),
      },
      {
        text: 'Spawn Settlement Team 0',
        action: (uiState: UIState) => actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 0 }),
      },
      {
        text: 'Spawn Settlement Team 1',
        action: (uiState: UIState) => actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 1 }),
      },
    ]
    interaction.toggle(uiState, devActions)
  }
  noSelectionHover(interaction: Interaction, actions: Actions, uiState: UIState) {
    const abilitiesActions = this.getAbilityActions(uiState, actions, ['hover'])
    interaction.toggle(uiState, abilitiesActions)
  }
  selectionNoHover(interaction: Interaction, actions: Actions, uiState: UIState) {
    const abilitiesActions = this.getAbilityActions(uiState, actions, ['selection'])
    interaction.toggle(uiState, abilitiesActions)
  }
  selectionHoverSelf(interaction: Interaction, actions: Actions, uiState: UIState) {
    const abilitiesActions = this.getAbilityActions(uiState, actions, ['selection', 'hover', 'hoverSelf'])
    const devActions = [
      {
        text: 'Add Item - Win 1906',
        action: (uiState: UIState) => actions.addItem(uiState, { kind: 'WEAPON_WIN1906' }),
      },
      {
        text: 'Add Item - .22 Short x 10',
        action: (uiState: UIState) => actions.addItem(uiState, { kind: 'AMMO_22_SHORT', quantity: 10 }),
      },
      {
        text: 'Add Item - Boonie',
        action: (uiState: UIState) => actions.addItem(uiState, { kind: 'BODY_HEAD_BOONIE' }),
      },
    ]
    interaction.toggle(uiState, abilitiesActions.concat(devActions))
  }
  selectionHoverOther(interaction: Interaction, actions: Actions, uiState: UIState) {
    const abilitiesActions = this.getAbilityActions(uiState, actions, ['selection', 'hover', 'hoverOther'])
    interaction.toggle(uiState, abilitiesActions)
  }
}
