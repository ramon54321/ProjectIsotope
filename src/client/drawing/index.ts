import * as PIXI from 'pixi.js'
import { DirtRegistry } from '../../shared/engine/dirt-registry'
import { Vec2 } from '../../shared/engine/math'
import { NSEntity, NetworkState } from '../../shared/game/network-state'
import { addCircle } from './circle'
import { addRect } from './rectangle'
import { addLine } from './line'
import { addText, addTextLive } from './text'
import { Input } from './input'
import { Camera } from '../camera'
import { HALF_HEIGHT, HALF_WIDTH, HEIGHT, WIDTH } from './constants'
import { Actions, UIState } from '../actions'
import { Timer } from '../timer'
import { Selection } from '../selection'
import { Interaction, MenuItem } from '../interaction'
import { getEntityDetails } from './ui'
import EventEmitter from 'node:events'

const PADDING_LEFT = 16
const PADDING_TOP = 16

class EntityLibrary {
  static getGraphics(app: PIXI.Application, entity: NSEntity) {
    const simpleKinds = ['Dummy', 'Pawn']

    if (simpleKinds.includes(entity.kind)) {
      const main = addCircle(app, 0, 0, 8)
      const displayNameText = entity.components.get('Identity')?.displayName
      if (displayNameText !== undefined) {
        const displayName = addText(app, displayNameText, 0, 20, 0.5)
        main.addChild(displayName)
      }
      return main
    } else if (entity.kind.includes('BUILDING')) {
      const dimensions = entity.components.get('Dimension')
      if (dimensions === undefined) throw new Error('No dimensions on building entity')
      const main = addRect(app, 0, 0, dimensions.width, dimensions.height, 0xeeeeee)
      const displayNameText = entity.components.get('Identity')?.displayName
      if (displayNameText !== undefined) {
        const displayName = addText(app, displayNameText, 0, dimensions.height / 2 + 12, 0.5)
        main.addChild(displayName)
      }
      return main
    } else {
      const body = new PIXI.Sprite(app.loader.resources['res/body1.png'].texture)
      body.anchor.set(0.5, 0.5)
      body.scale.set(0.5, 0.5)
      const head = new PIXI.Sprite(app.loader.resources['res/body1_head.png'].texture)
      head.anchor.set(0.55, 0.85)
      head.scale.set(1.25, 1.25)
      body.addChild(head)
      app.stage.addChild(body)
      return body
    }
  }
}

export class Graphics {
  private readonly networkState: NetworkState
  private readonly actions: Actions
  private readonly events: EventEmitter

  private readonly app: PIXI.Application
  private readonly ui: any = {}
  private readonly input = new Input()
  private readonly entitiesRegistry = new DirtRegistry()
  private readonly entitiesMap = new Map<string, PIXI.Graphics>()
  private readonly selection = new Selection()
  private readonly tickTimer = new Timer()
  private interaction!: Interaction
  private camera!: Camera

  constructor(networkState: NetworkState, actions: Actions, events: EventEmitter) {
    this.networkState = networkState
    this.actions = actions
    this.events = events
    PIXI.utils.skipHello()
    this.app = new PIXI.Application({
      autoDensity: true,
      resolution: 2,
      antialias: true,
      width: WIDTH,
      height: HEIGHT,
    })
    document.body.appendChild(this.app.view)
    this.app.loader.add(['res/body1.png', 'res/body1_head.png']).load(() => this.start())
  }

  start() {
    this.setStageCenter()
    this.createCamera()
    this.createInteraction()
    this.createInput()
    this.createBackground()
    this.createOriginMarkers()
    this.createUI()
    this.createEntities()
    this.app.ticker.add(() => this.input.reset())
  }

  beforeTick() {
    this.tickTimer.lap()
    this.entitiesMap.forEach((graphics: any, entityId: string) => {
      const position = this.networkState.getEntityComponent(entityId, 'Position')?.position
      if (position === undefined) return
      graphics.lastPosition = new Vec2(position.x, position.y)
    })
  }
  afterTick() {
    this.entitiesMap.forEach((graphics: any, entityId: string) => {
      const position = this.networkState.getEntityComponent(entityId, 'Position')?.position
      if (position === undefined) return
      graphics.velocity = graphics.lastPosition.differenceTo(position)
    })
  }

  private setStageCenter() {
    this.app.stage.position.set(HALF_WIDTH, HALF_HEIGHT)
  }
  private createCamera() {
    this.camera = new Camera(this.input)
    this.app.ticker.add(delta => this.camera.render(delta))
  }
  private createInteraction() {
    this.interaction = new Interaction(this.app)
    this.app.ticker.add(() => {
      const selectedEntity = this.selection.getSelectedEntity()
      const hoverEntity = this.selection.getHoverEntity()
      const cameraPosition = this.camera.getPosition()
      const mouseScreenPosition = this.input.getMouseScreenPosition(this.app)
      const mouseWorldPosition = this.input.getMouseWorldPosition(this.app, cameraPosition)
      const uiState: UIState = {
        mouseScreenPosition: mouseScreenPosition,
        mouseWorldPosition: mouseWorldPosition,
        selectedEntity: selectedEntity!,
        hoverEntity: hoverEntity!,
      }

      this.ui.background.on('mouseup', () => this.interaction.close())
      const shouldOpenMenu = this.input.getInputOnce('e')

      /**
       *
       * No Selection
       *  No Hover      General
       *  Hover         General + Hover
       *
       * Selection
       *  No Hover      General + Selection(With No Hover)
       *  Hover         General + Selection(With No Hover) + Selection(With Hover) + Hover
       *
       */

      if (shouldOpenMenu && selectedEntity && hoverEntity) {
        const abilitiesActions = Array.from(selectedEntity.components.values())
          .map(component => component.abilities)
          .filter(abilities => abilities !== undefined)
          .reduce((acc, abilities) => abilities.concat(acc), [])
          .map((ability: any) => ({
            text: ability.text,
            action: (uiState: UIState) => (this.actions as any)[ability.method]?.(uiState),
          }))
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
        this.interaction.toggle(mouseScreenPosition, uiState, abilitiesActions.concat(devActions))
      } else if (shouldOpenMenu && selectedEntity) {
        const abilitiesActions = Array.from(selectedEntity.components.values())
          .map(component => component.abilities)
          .filter(abilities => abilities !== undefined)
          .reduce((acc, abilities) => abilities.concat(acc), [])
          .map((ability: any) => ({
            text: ability.text,
            action: (uiState: UIState) => (this.actions as any)[ability.method]?.(uiState),
          }))
        this.interaction.toggle(mouseScreenPosition, uiState, abilitiesActions)
      } else if (shouldOpenMenu) {
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
        this.interaction.toggle(mouseScreenPosition, uiState, devActions)
      }
    })
  }
  private createInput() {
    this.app.ticker.add(() => {
      // const selectedEntity = this.selection.getSelectedEntity()
      // const cameraPosition = this.camera.getPosition()
      // const mouseWorldPosition = this.input.getMouseWorldPosition(this.app, cameraPosition)
      // if (selectedEntity && this.input.getInputOnce('m')) {
      //   this.actions.moveEntity(selectedEntity.id, mouseWorldPosition)
      // }
    })
  }
  private createBackground() {
    this.ui.background = addRect(this.app, 0, 0, WIDTH, HEIGHT)
    this.ui.background.interactive = true
    this.ui.background.on('mouseup', () => this.selection.clearSelectedEntity())
    this.ui.background.on('mouseover', () => this.selection.clearHoverEntity())
  }
  private createOriginMarkers() {
    this.ui.origin = addCircle(this.app, 0, 0, 3)
    this.ui.originVertical = addLine(this.app, 0, -HALF_HEIGHT, 0, HEIGHT, 1, 0xeeeeee, 0.5)
    this.ui.originHorizontal = addLine(this.app, -HALF_WIDTH, 0, WIDTH, 0, 1, 0xeeeeee, 0.5)
    this.app.ticker.add(delta => {
      const cameraPosition = this.camera.getPosition()
      this.ui.origin.position.set(-cameraPosition.x, -cameraPosition.y)
      this.ui.originVertical.position.x = -cameraPosition.x
      this.ui.originHorizontal.position.y = -cameraPosition.y
    })
  }
  private createUI() {
    this.ui.textServerTickRate = addTextLive(
      this.app,
      [
        {
          emitter: this.networkState.getEventEmitter(),
          event: 'setServerTickRate',
        },
      ],
      () => 'Tick Rate: ' + this.networkState.getServerTickRate().toFixed(0),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 0,
      0,
    )
    this.ui.textEntityId = addTextLive(
      this.app,
      [
        {
          emitter: this.selection.getEventEmitter(),
          event: 'entity',
        },
      ],
      () => 'Selected EntityID: ' + (this.selection.getSelectedEntity()?.id || 'None'),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 1,
      0,
    )
    this.ui.textWorldName = addTextLive(
      this.app,
      [
        {
          emitter: this.networkState.getEventEmitter(),
          event: 'setWorldName',
        },
      ],
      () => 'World Name: ' + this.networkState.getWorldName(),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 2,
      0,
    )
    this.ui.selectedEntityDetails = addTextLive(
      this.app,
      [
        {
          emitter: this.selection.getEventEmitter(),
          event: 'entity',
        },
        {
          emitter: this.events,
          event: 'state',
        },
      ],
      () => {
        const entity = this.selection.getHoverEntity() || this.selection.getSelectedEntity()
        return getEntityDetails(this.networkState, entity)
      },
      HALF_WIDTH - PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 0,
      1,
      0,
    )
  }
  private createEntities() {
    const createEntity = (entity: NSEntity, cameraPosition: Vec2) => {
      const graphics = EntityLibrary.getGraphics(this.app, entity) as any
      graphics.interactive = true
      graphics.on('mouseup', () => this.selection.setSelectedEntity(entity))
      graphics.on('mouseover', () => this.selection.setHoverEntity(entity))
      const position = entity.components.get('Position')?.position
      if (position === undefined) {
        throw new Error('Position component not found ... this should not be possible... ensure component is set in network state')
      }
      graphics.position.set(position.x - cameraPosition.x, position.y - cameraPosition.y)
      graphics.lastPosition = new Vec2(position.x, position.y)
      graphics.velocity = new Vec2(0, 0)
      this.entitiesMap.set(entity.id, graphics)
    }
    const destroyEntity = (id: string) => {
      const graphics = this.entitiesMap.get(id)
      if (!graphics) {
        throw new Error('Graphics can not be removed... this should not be possible')
      }
      this.app.stage.removeChild(graphics)
      this.entitiesMap.delete(id)
    }
    const updateEntity = (delta: number, entity: NSEntity, cameraPosition: Vec2, tickInterpolation: number) => {
      const graphics = this.entitiesMap.get(entity.id) as any
      if (!graphics) {
        throw new Error('Graphics can not be removed... this should not be possible')
      }
      const movement = graphics.velocity.scale(tickInterpolation)
      const position = new Vec2(graphics.lastPosition.x + movement.x, graphics.lastPosition.y + movement.y)
      graphics.position.set(position.x - cameraPosition.x, position.y - cameraPosition.y)
    }
    this.app.ticker.add(delta => {
      const cameraPosition = this.camera.getPosition()
      const timeSinceLastTick = this.tickTimer.getLapTime()
      const tickInterpolation = (timeSinceLastTick * this.networkState.getServerTickRate()) / 1000
      this.entitiesRegistry.update(
        this.networkState.getEntities(),
        entity => createEntity(entity, cameraPosition),
        id => destroyEntity(id),
        entity => updateEntity(delta, entity, cameraPosition, tickInterpolation),
      )
    })
  }
}
