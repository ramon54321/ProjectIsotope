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
import { getEntityDetails, getGameDetails } from './ui'
import EventEmitter from 'events'
import { Menu } from '../menu'
import { GameOptions } from '../game-options'
import { ClientState } from '../client-state'
import { IdManager } from '../../server/engine/id-manager'
import { Stats } from '../../shared/game/stats'
import gen from 'random-seed'

const R = gen.create('12345')

const PADDING_LEFT = 16
const PADDING_TOP = 16

interface WorldSprite extends PIXI.Sprite {
  worldPosition: Vec2
}

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
    this.app.loader.add(['res/body1.png', 'res/body1_head.png', 'res/tuff_1.png', 'res/tree_1.png']).load(() => this.start())
  }

  start() {
    this.setStageCenter()
    this.createCamera()
    this.createClientState()
    this.createBackground()
    this.createWorld()
    this.createInteraction()
    this.createMenu()
    this.createInput()
    this.createOriginMarkers()
    this.createUI()
    this.createEntities()
    this.createInstantEntities()
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

  private readonly instantEntities = new Map<string, [number, PIXI.Graphics]>()
  classBInstant(payload: any) {
    if (payload.kind === undefined) return
    if (payload.kind.startsWith('ATTACK')) {
      const id = IdManager.generateId()
      const entity = addCircle(this.app, payload.origin.x, payload.origin.y, 2, this.networkState.getTeams()[payload.team]) as any
      entity.payload = payload
      entity.worldPosition = new Vec2(entity.position.x, entity.position.y)
      const durationSeconds = (Stats.Instants as any)[payload.kind].durationSeconds
      this.instantEntities.set(id, [durationSeconds, entity])
    }
  }

  private setStageCenter() {
    this.app.stage.position.set(HALF_WIDTH, HALF_HEIGHT)
  }
  private createInstantEntities() {
    this.app.ticker.add(delta => {
      const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
      const toRemoveIds: string[] = []
      this.instantEntities.forEach((value, key) => {
        value[0] -= deltaTimeSeconds
        if (value[0] <= 0) toRemoveIds.push(key)
      })
      toRemoveIds.forEach(id => {
        const graphics = this.instantEntities.get(id)![1]
        graphics.destroy()
        this.instantEntities.delete(id)
      })
      const cameraWorldPosition = this.camera.getPosition()
      this.instantEntities.forEach(value => {
        ;(value[1] as any).worldPosition.x += (value[1] as any).payload.velocity.x * deltaTimeSeconds
        ;(value[1] as any).worldPosition.y += (value[1] as any).payload.velocity.y * deltaTimeSeconds
        ;(value[1] as any).position.set(
          -cameraWorldPosition.x + (value[1] as any).worldPosition.x,
          -cameraWorldPosition.y + (value[1] as any).worldPosition.y,
        )
        value[1].alpha -= deltaTimeSeconds * 0.2
      })
    })
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

  private readonly worldSprites = new Map<string, WorldSprite>()
  private createWorld() {
    addRect(this.app, 0, 0, WIDTH, HEIGHT, 'TerrainBase')
    const tuffCount = Math.sqrt(WIDTH * HEIGHT) / 10
    for (let i = 0; i < tuffCount; i++) {
      const id = IdManager.generateId()
      const tuff = new PIXI.Sprite(this.app.loader.resources['res/tuff_1.png'].texture) as WorldSprite
      tuff.scale.set(0.5, 0.5)
      tuff.anchor.set(0.5, 0.5)
      tuff.rotation = Math.PI * R.random() * 2
      tuff.worldPosition = new Vec2(R.range(WIDTH), R.range(HEIGHT))
      this.app.stage.addChild(tuff)
      this.worldSprites.set(id, tuff)
    }
    this.app.ticker.add(delta => {
      const cameraWorldPosition = this.camera.getPosition()
      this.worldSprites.forEach(sprite => {
        const x = -cameraWorldPosition.x + sprite.worldPosition.x
        const y = -cameraWorldPosition.y + sprite.worldPosition.y
        const xL = x % WIDTH < 0 ? (x % WIDTH) + HALF_WIDTH : (x % WIDTH) - HALF_WIDTH
        const yL = y % HEIGHT < 0 ? (y % HEIGHT) + HALF_HEIGHT : (y % HEIGHT) - HALF_HEIGHT
        sprite.position.set(xL, yL)
      })
    })
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
    this.ui.gameDetails = addTextLive(
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
        {
          emitter: this.networkState.getEventEmitter(),
          event: 'setServerTickRate',
        },
        {
          emitter: this.networkState.getEventEmitter(),
          event: 'setWorldName',
        },
        {
          emitter: this.clientState.getEventEmitter(),
          event: 'team',
        },
        {
          emitter: this.gameOptions.getEventEmitter(),
          event: 'isDevMode',
        },
      ],
      () => getGameDetails(this.networkState, this.gameOptions, this.clientState, this.selection.getSelectedEntity()),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 0,
      0,
      0,
      'left',
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
      'right',
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
