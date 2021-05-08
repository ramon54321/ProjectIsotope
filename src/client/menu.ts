import { UIState } from './actions'
import { Camera } from './camera'
import { Gtx } from './graphics'
import { Input } from './input'
import { Interaction, MenuItem } from './interaction'

export class Menu {
  private readonly gtx: Gtx
  private readonly interaction: Interaction
  private readonly camera: Camera
  private readonly input: Input
  constructor(gtx: Gtx, interaction: Interaction, camera: Camera, input: Input) {
    this.gtx = gtx
    this.interaction = interaction
    this.camera = camera
    this.input = input
    this.gtx.app.ticker.add(delta => this.tick(delta))
  }
  private tick(delta: number) {
    const selectedEntity = this.gtx.selection.getSelectedEntity()
    const hoverEntity = this.gtx.selection.getHoverEntity()
    const mouseScreenPosition = this.camera.getMouseScreenPosition()
    const mouseWorldPosition = this.camera.getMouseWorldPosition()

    const shouldOpenContextMenu = this.input.getInputOnce('e')
    if (shouldOpenContextMenu) {
      const uiState: UIState = {
        mouseScreenPosition: mouseScreenPosition,
        mouseWorldPosition: mouseWorldPosition,
        selectedEntity: selectedEntity!,
        hoverEntity: hoverEntity!,
      }
      if (!selectedEntity) {
        if (!hoverEntity) {
          this.noSelectionNoHover(uiState)
        } else {
          this.noSelectionHover(uiState)
        }
      } else {
        if (!hoverEntity) {
          this.selectionNoHover(uiState)
        } else if (hoverEntity === selectedEntity) {
          this.selectionHoverSelf(uiState)
        } else {
          this.selectionHoverOther(uiState)
        }
      }
    }

    const shouldOpenQuitMenu = this.input.getInputOnce('q')
    if (shouldOpenQuitMenu) {
      const uiState: UIState = {
        mouseScreenPosition: mouseScreenPosition,
        mouseWorldPosition: mouseWorldPosition,
        selectedEntity: selectedEntity!,
        hoverEntity: hoverEntity!,
      }
      this.quitMenu(uiState)
    }
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
          action: (uiState: UIState) => (this.gtx.actions as any)[ability.method]?.(uiState, ability.options),
        }))
    }
    return []
  }
  private noSelectionNoHover(uiState: UIState) {
    const mainActions = [
      {
        text: 'Build',
        action: (uiState: UIState) =>
          this.interaction.push(uiState, [
            {
              text: 'Stockpile',
              action: (uiState: UIState) =>
                this.gtx.actions.spawnEntity(uiState, { kind: 'BUILDING_STOCKPILE', team: this.gtx.clientState.getTeam() }),
            },
          ]),
      },
    ]
    const devActions = [
      {
        text: 'Spawn Dummy',
        action: (uiState: UIState) => this.gtx.actions.spawnEntity(uiState, { kind: 'Pawn' }),
      },
      {
        text: 'Spawn Pawn Team 0',
        action: (uiState: UIState) => this.gtx.actions.spawnEntity(uiState, { kind: 'Pawn', team: 0 }),
      },
      {
        text: 'Spawn Pawn Team 1',
        action: (uiState: UIState) => this.gtx.actions.spawnEntity(uiState, { kind: 'Pawn', team: 1 }),
      },
      {
        text: 'Spawn Settlement Team 0',
        action: (uiState: UIState) => this.gtx.actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 0 }),
      },
      {
        text: 'Spawn Settlement Team 1',
        action: (uiState: UIState) => this.gtx.actions.spawnEntity(uiState, { kind: 'BUILDING_SETTLEMENT', team: 1 }),
      },
    ]
    const actions = this.gtx.gameOptions.getIsDevMode() ? mainActions.concat(devActions) : mainActions
    this.interaction.toggle(uiState, actions)
  }
  private noSelectionHover(uiState: UIState) {
    if (uiState.hoverEntity.components.get('Team').team !== this.gtx.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['hover'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  private selectionNoHover(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.gtx.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  private selectionHoverSelf(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.gtx.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection', 'hover', 'hoverSelf'])
    const devActions = [
      {
        text: 'Add Item - Win 1906',
        action: (uiState: UIState) => this.gtx.actions.addItem(uiState, { kind: 'WEAPON_WIN1906' }),
      },
      {
        text: 'Add Item - .22 Short x 10',
        action: (uiState: UIState) => this.gtx.actions.addItem(uiState, { kind: 'AMMO_22_SHORT', quantity: 10 }),
      },
      {
        text: 'Add Item - Boonie',
        action: (uiState: UIState) => this.gtx.actions.addItem(uiState, { kind: 'BODY_HEAD_BOONIE' }),
      },
    ]
    const actions = this.gtx.gameOptions.getIsDevMode() ? abilitiesActions.concat(devActions) : abilitiesActions
    this.interaction.toggle(uiState, actions)
  }
  private selectionHoverOther(uiState: UIState) {
    if (uiState.selectedEntity.components.get('Team').team !== this.gtx.clientState.getTeam()) return
    const abilitiesActions = this.getAbilityActions(uiState, ['selection', 'hover', 'hoverOther'])
    this.interaction.toggle(uiState, abilitiesActions)
  }
  private quitMenu(uiState: UIState) {
    const mainActions = [
      {
        text: 'Quit',
        action: (uiState: UIState) => window.close(),
      },
    ]
    const devActions = [
      {
        text: 'Set Team 0',
        action: (uiState: UIState) => this.gtx.clientState.setTeam(0),
      },
      {
        text: 'Set Team 1',
        action: (uiState: UIState) => this.gtx.clientState.setTeam(1),
      },
      {
        text: 'Set Team 2',
        action: (uiState: UIState) => this.gtx.clientState.setTeam(2),
      },
    ]
    const actions = this.gtx.gameOptions.getIsDevMode() ? mainActions.concat(devActions) : mainActions
    this.interaction.toggle(uiState, actions)
  }
}
