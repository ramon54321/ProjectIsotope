import { Actions, UIState } from './actions'
import { ClientState } from './client-state'
import { GameOptions } from './game-options'
import { Interaction, MenuItem } from './interaction'

export class Menu {
  private readonly interaction: Interaction
  private readonly actions: Actions
  private readonly gameOptions: GameOptions
  private readonly clientState: ClientState
  constructor(interaction: Interaction, actions: Actions, gameOptions: GameOptions, clientState: ClientState) {
    this.interaction = interaction
    this.actions = actions
    this.gameOptions = gameOptions
    this.clientState = clientState
  }
  private readonly abilityRequirementMap: any = {
    moveEntity: {
      required: ['selection'],
      unallowed: ['hoverSelf'],
    },
    submitOrder: {
      required: ['selection', 'hoverSelf'],
    },
  }
  private getAbilityActions(uiState: UIState, available: string[]): MenuItem[] {
    const actionEntity = uiState.selectedEntity || uiState.hoverEntity
    if (actionEntity) {
      return Array.from(actionEntity.components.values())
        .map(component => component.abilities)
        .filter(abilities => abilities !== undefined)
        .reduce((acc, abilities) => abilities.concat(acc), [])
        .filter((ability: any) => {
          const abilityRequired = this.abilityRequirementMap[ability.method]?.required
          const abilityUnallowed = this.abilityRequirementMap[ability.method]?.unallowed
          const _required = abilityRequired || []
          const unallowed = abilityUnallowed || []
          return _required.every((x: string) => available.includes(x)) && !unallowed.some((x: string) => available.includes(x))
        })
        .map((ability: any) => ({
          text: ability.text,
          action: (uiState: UIState) => (this.actions as any)[ability.method]?.(uiState, ability.options),
        }))
    }
    return []
  }
  noSelectionNoHover(uiState: UIState) {
    const mainActions = [
      {
        text: 'Build',
        action: (uiState: UIState) =>
          this.interaction.push(uiState, [
            {
              text: 'Stockpile',
              action: (uiState: UIState) =>
                this.actions.spawnEntity(uiState, { kind: 'BUILDING_STOCKPILE', team: this.clientState.getTeam() }),
            },
          ]),
      },
    ]
    const devActions = [
      {
        text: 'Spawn Dummy',
        action: (uiState: UIState) => this.actions.spawnEntity(uiState, { kind: 'Pawn' }),
      },
      {
        text: 'Spawn Pawn Team 0',
        action: (uiState: UIState) => this.actions.spawnEntity(uiState, { kind: 'Pawn', team: 0 }),
      },
      {
        text: 'Spawn Pawn Team 1',
        action: (uiState: UIState) => this.actions.spawnEntity(uiState, { kind: 'Pawn', team: 1 }),
      },
      {
        text: 'Spawn Settlement Team 0',
        action: (uiState: UIState) => this.actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 0 }),
      },
      {
        text: 'Spawn Settlement Team 1',
        action: (uiState: UIState) => this.actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 1 }),
      },
    ]
    const actions = this.gameOptions.getIsDevMode() ? mainActions.concat(devActions) : mainActions
    this.interaction.toggle(uiState, actions)
  }
  noSelectionHover(uiState: UIState) {
    if (uiState.hoverEntity.components.get('Team').team !== this.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['hover'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  selectionNoHover(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  selectionHoverSelf(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection', 'hover', 'hoverSelf'])
    const devActions = [
      {
        text: 'Add Item - Win 1906',
        action: (uiState: UIState) => this.actions.addItem(uiState, { kind: 'WEAPON_WIN1906' }),
      },
      {
        text: 'Add Item - .22 Short x 10',
        action: (uiState: UIState) => this.actions.addItem(uiState, { kind: 'AMMO_22_SHORT', quantity: 10 }),
      },
      {
        text: 'Add Item - Boonie',
        action: (uiState: UIState) => this.actions.addItem(uiState, { kind: 'BODY_HEAD_BOONIE' }),
      },
    ]
    this.interaction.toggle(uiState, abilitiesActions.concat(devActions))
  }
  selectionHoverOther(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection', 'hover', 'hoverOther'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  quitMenu(uiState: UIState) {
    const mainActions = [
      {
        text: 'Quit',
        action: (uiState: UIState) => window.close(),
      },
    ]
    const devActions = [
      {
        text: 'Set Team 0',
        action: (uiState: UIState) => this.clientState.setTeam(0),
      },
      {
        text: 'Set Team 1',
        action: (uiState: UIState) => this.clientState.setTeam(1),
      },
      {
        text: 'Set Team 2',
        action: (uiState: UIState) => this.clientState.setTeam(2),
      },
    ]
    const actions = this.gameOptions.getIsDevMode() ? mainActions.concat(devActions) : mainActions
    this.interaction.toggle(uiState, actions)
  }
}
