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
import { Interaction } from '../interaction'
import { getEntityDetails } from './ui'
import EventEmitter from 'events'
import { Menu } from '../menu'
import { GameOptions } from '../game-options'
import { ClientState } from '../client-state'

const PADDING_LEFT = 16
const PADDING_TOP = 16

class EntityLibrary {
  static getGraphics(app: PIXI.Application, entity: NSEntity, networkState: NetworkState) {
    const simpleKinds = ['Dummy', 'Pawn']
    const team = entity.components.get('Team')?.team
    const colorName = networkState.getTeams()[team]
    if (simpleKinds.includes(entity.kind)) {
      const main = addCircle(app, 0, 0, 8, colorName)
      const displayNameText = entity.components.get('Identity')?.displayName
      if (displayNameText !== undefined) {
        const displayName = addText(app, displayNameText, 0, 20, 0.5)
        main.addChild(displayName)
      }
      return main
    } else if (entity.kind.includes('BUILDING')) {
      const dimensions = entity.components.get('Dimension')
      if (dimensions === undefined) throw new Error('No dimensions on building entity')
      const main = addRect(app, 0, 0, dimensions.width, dimensions.height, colorName)
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
  private readonly gameOptions: GameOptions
  private readonly app: PIXI.Application
  private readonly clientState: ClientState = new ClientState()
  private readonly ui: any = {}
  private readonly input = new Input()
  private readonly entitiesRegistry = new DirtRegistry()
  private readonly entitiesMap = new Map<string, PIXI.Graphics>()
  private readonly selection = new Selection()
  private readonly tickTimer = new Timer()
  private interaction!: Interaction
  private menu!: Menu
  private camera!: Camera

  constructor(networkState: NetworkState, actions: Actions, events: EventEmitter, gameOptions: GameOptions) {
    this.networkState = networkState
    this.actions = actions
    this.events = events
    this.gameOptions = gameOptions
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
    this.createClientState()
    this.createBackground()
    this.createInteraction()
    this.createMenu()
    this.createInput()
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
  private createClientState() {
    this.app.ticker.add(delta => {
      if (this.input.getInputOnce('p')) {
        this.gameOptions.toggleDevMode()
      }
    })
  }
  private createInteraction() {
    this.interaction = new Interaction(this.app)
    this.ui.background.on('mouseup', () => this.interaction.close())
    this.app.ticker.add(() => {
      const selectedEntity = this.selection.getSelectedEntity()
      const hoverEntity = this.selection.getHoverEntity()
      const cameraPosition = this.camera.getPosition()
      const mouseScreenPosition = this.input.getMouseScreenPosition(this.app)
      const mouseWorldPosition = this.input.getMouseWorldPosition(this.app, cameraPosition)

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
            this.menu.noSelectionNoHover(uiState)
          } else {
            this.menu.noSelectionHover(uiState)
          }
        } else {
          if (!hoverEntity) {
            this.menu.selectionNoHover(uiState)
          } else if (hoverEntity === selectedEntity) {
            this.menu.selectionHoverSelf(uiState)
          } else {
            this.menu.selectionHoverOther(uiState)
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
        this.menu.quitMenu(uiState)
      }
    })
  }
  private createMenu() {
    this.menu = new Menu(this.interaction, this.actions, this.gameOptions, this.clientState)
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
    this.ui.helpReload = addText(this.app, "Press 'q' for menu", -HALF_WIDTH + PADDING_LEFT, HALF_HEIGHT - PADDING_TOP - 16 * 2, 0)
    this.ui.helpReload = addTextLive(
      this.app,
      [
        {
          emitter: this.gameOptions.getEventEmitter(),
          event: 'isDevMode',
        },
      ],
      () => `Press 'p' to ${this.gameOptions.getIsDevMode() ? 'exit' : 'enter'} Dev Mode...`,
      -HALF_WIDTH + PADDING_LEFT,
      HALF_HEIGHT - PADDING_TOP - 16 * 1,
      0,
    )
    this.ui.helpReload = addText(this.app, 'Press CMD+R to reload...', -HALF_WIDTH + PADDING_LEFT, HALF_HEIGHT - PADDING_TOP - 16 * 0, 0)
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
      const graphics = EntityLibrary.getGraphics(this.app, entity, this.networkState) as any
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
