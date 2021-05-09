import * as PIXI from 'pixi.js'
import { ActiveTotal, Gtx } from './graphics'
import { Vec2 } from '../shared/engine/math'
import { NSEntity } from '../shared/game/network-state'
import { Stats } from '../shared/game/stats'
import { createText } from './drawing/text'

type DisplayListItem = {
  name?: string
  value: string
}

export class UserInterface {
  private readonly gtx: Gtx
  private readonly entityManager: ActiveTotal
  private readonly fixtureManager: ActiveTotal
  private readonly width: number
  private readonly height: number
  private readonly container: PIXI.Container
  constructor(gtx: Gtx, entityManager: ActiveTotal, fixtureManager: ActiveTotal) {
    this.gtx = gtx
    this.entityManager = entityManager
    this.fixtureManager = fixtureManager
    this.width = this.gtx.app.renderer.width / this.gtx.app.renderer.resolution
    this.height = this.gtx.app.renderer.height / this.gtx.app.renderer.resolution

    // Setup Container
    this.container = gtx.renderLayers.getRenderLayer('UI')

    // Create Details
    this.createClientDetails()
    this.createHelpDetails()
    this.createEntityDetails()
  }
  private readonly padding = 20
  private createClientDetails() {
    const x = this.padding
    const y = this.padding
    const details = createText('', x, y, {
      anchor: new Vec2(0, 0),
      align: 'left',
      colorName: 'UserInterfaceText',
    })
    const setText = () => {
      details.text = this.getClientDetails()
      if (this.gtx.gameOptions.getIsDevMode()) {
        details.position.y = y + 60
      } else {
        details.position.y = y
      }
    }
    setText()
    this.gtx.events.on('render', setText)
    this.gtx.events.on('state', setText)
    this.container.addChild(details)
  }
  private createHelpDetails() {
    const x = this.padding
    const y = this.height - this.padding
    const details = createText('', x, y, {
      anchor: new Vec2(0, 1),
      align: 'left',
      colorName: 'UserInterfaceText',
    })
    const setText = () => {
      const lines = [
        `Press 'q' for menu`,
        `Press 'p' to ${this.gtx.gameOptions.getIsDevMode() ? 'exit' : 'enter'} Dev Mode`,
        `Press 'Cmd + r' to reload`,
      ]
      details.text = lines.join('\n')
    }
    setText()
    this.gtx.gameOptions.getEventEmitter().on('isDevMode', setText)
    this.container.addChild(details)
  }
  private createEntityDetails() {
    const x = this.width - this.padding
    const y = this.padding
    const details = createText('', x, y, {
      anchor: new Vec2(1, 0),
      align: 'right',
      colorName: 'UserInterfaceText',
    })
    const setText = () => {
      const entity = this.gtx.selection.getHoverEntity() || this.gtx.selection.getSelectedEntity()
      details.text = this.getEntityDetails(entity)
    }
    setText()
    this.gtx.selection.getEventEmitter().on('entity', setText)
    this.gtx.events.on('state', setText)
    this.container.addChild(details)
  }

  private getEntityDetails(entity: NSEntity | undefined): string {
    if (entity === undefined) return ''
    const displayName = entity.components.get('Identity')?.displayName
    const speed = (Stats.Entities as any)[entity.kind]?.speed
    const factory = entity.components.get('Factory')?.orders.map((order: any) => `${order.kind}: ${(order.percent * 100).toFixed(0)}%`)
    const inventory = entity.components.get('Inventory')?.items.map((id: string) => {
      const item = this.gtx.networkState.getItem(id) as any
      if (item === undefined) return 'unknown'
      const itemKind = item.kind
      const label = (Stats.Items as any)[itemKind]?.displayName || 'unknown'
      const quantity = item.quantity
      return `${label}${quantity ? ' x' + quantity : ''}`
    })
    const list: DisplayListItem[] = [
      {
        value: displayName,
      },
      {
        name: 'Speed',
        value: speed,
      },
      {
        name: 'Production',
        value: this.getArrayDetails(factory)?.join('\n\t'),
      },
      {
        name: 'Inventory',
        value: this.getArrayDetails(inventory)?.join('\n\t'),
      },
    ]
    return list
      .filter(item => item.value !== undefined)
      .map(item => `${item.name ? item.name + ':\n' : ''}${item.value}\n`)
      .join('\n')
  }
  private getClientDetails(): string {
    const entities = `Entities: ${this.entityManager.getActiveCount()}/${this.entityManager.getTotalCount()}`
    const fixtures = `Fixtures: ${this.fixtureManager.getActiveCount()}/${this.fixtureManager.getTotalCount()}`
    const selectedEntity = this.gtx.selection.getSelectedEntity()
    const tickRate = `Tick Rate: ${this.gtx.networkState.getServerTickRate()}`
    const selectedEntityId = selectedEntity ? `Selected Entity ID: ${selectedEntity.id}` : undefined
    const team = `Team: ${this.gtx.networkState.getTeams()[this.gtx.clientState.getTeam()]}`
    const isDevMode = this.gtx.gameOptions.getIsDevMode()
    const list = [
      isDevMode ? entities : undefined,
      isDevMode ? fixtures : undefined,
      isDevMode ? tickRate : undefined,
      isDevMode ? selectedEntityId : undefined,
      team,
    ]
    return list.filter(item => item !== undefined).join('\n')
  }

  private getArrayDetails(arr: any[]): any {
    if (arr === undefined || !Array.isArray(arr)) return undefined
    if (arr.length > 0) return arr
  }
}
