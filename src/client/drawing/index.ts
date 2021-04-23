import * as PIXI from 'pixi.js'
import { DirtRegistry } from '../../shared/engine/dirt-registry'
import { Vec2 } from '../../shared/engine/math'
import { NSEntity, NetworkState } from '../../shared/game/network-state'
import { addCircle } from './circle'
import { addRect } from './rectangle'
import { addLine } from './line'
import { addTextLive } from './text'
import { Input } from './input'
import { Camera } from '../camera'
import EventEmitter from 'events'
import { HALF_HEIGHT, HALF_WIDTH, HEIGHT, WIDTH } from './constants'
import { Actions } from '../actions'

const PADDING_LEFT = 16
const PADDING_TOP = 16

class EntityLibrary {
  static getGraphics(app: PIXI.Application, entity: NSEntity) {
    if (entity.kind === 'dummy') {
      return addCircle(app, 0, 0, 8)
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

class Selection {
  private selectedEntity: NSEntity | undefined
  private readonly events = new EventEmitter()
  getEventEmitter(): EventEmitter {
    return this.events
  }
  getSelectedEntity(): NSEntity | undefined {
    return this.selectedEntity
  }
  setSelectedEntity(entity: NSEntity) {
    this.selectedEntity = entity
    this.events.emit('entity')
    this.events.emit('entity-set')
  }
  clearSelectedEntity() {
    this.selectedEntity = undefined
    this.events.emit('entity')
    this.events.emit('entity-clear')
  }
}

export class Graphics {
  private readonly networkState: NetworkState
  private readonly actions: Actions

  private readonly app: PIXI.Application
  private readonly ui: any = {}
  private readonly input = new Input()
  private camera!: Camera
  private readonly entitiesRegistry = new DirtRegistry()
  private readonly entitiesMap = new Map<string, PIXI.Graphics>()
  private readonly selection = new Selection()

  constructor(networkState: NetworkState, actions: Actions) {
    this.networkState = networkState
    this.actions = actions
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
    this.createInput()
    this.createBackground()
    this.createOriginMarkers()
    this.createUI()
    this.createEntities()
    this.app.ticker.add(() => this.input.reset())
  }

  private setStageCenter() {
    this.app.stage.position.set(HALF_WIDTH, HALF_HEIGHT)
  }
  private createCamera() {
    this.camera = new Camera(this.input)
    this.app.ticker.add(delta => this.camera.render(delta))
  }
  private createInput() {
    this.app.ticker.add(() => {
      const selectedEntity = this.selection.getSelectedEntity()
      const cameraPosition = this.camera.getPosition()
      if (selectedEntity && this.input.getInputOnce('m')) {
        const worldPosition = this.input.getMouseWorldPosition(this.app, cameraPosition)
        this.actions.moveEntity(selectedEntity.id, worldPosition)
      }
    })
  }
  private createBackground() {
    this.ui.background = addRect(this.app, 0, 0, WIDTH, HEIGHT)
    this.ui.background.interactive = true
    this.ui.background.on('mouseup', () => this.selection.clearSelectedEntity())
  }
  private createOriginMarkers() {
    this.ui.origin = addCircle(this.app, 0, 0, 8)
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
    this.ui.worldName = addTextLive(
      this.app,
      this.networkState.getEventEmitter(),
      'setWorldName',
      () => this.networkState.getWorldName(),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP,
      0,
    )
    this.ui.worldName = addTextLive(
      this.app,
      this.selection.getEventEmitter(),
      'entity',
      () => this.selection.getSelectedEntity()?.id || 'None',
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP + 16 * 1,
      0,
    )
  }
  private createEntities() {
    const createEntity = (entity: NSEntity, cameraPosition: Vec2) => {
      const graphics = EntityLibrary.getGraphics(this.app, entity) as any
      graphics.interactive = true
      graphics.on('mouseup', () => this.selection.setSelectedEntity(entity))
      graphics.position.set(entity.position.x - cameraPosition.x, entity.position.y - cameraPosition.y)
      graphics.lastPosition = {
        x: entity.position.x,
        y: entity.position.y,
      }
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
    const updateEntity = (entity: NSEntity, cameraPosition: Vec2) => {
      const graphics = this.entitiesMap.get(entity.id) as any
      if (!graphics) {
        throw new Error('Graphics can not be removed... this should not be possible')
      }
      const dx = entity.position.x - graphics.lastPosition.x
      const dy = entity.position.y - graphics.lastPosition.y
      graphics.lastPosition.x = graphics.lastPosition.x + dx / 16
      graphics.lastPosition.y = graphics.lastPosition.y + dy / 16
      graphics.scale.x = dx < 0 ? Math.abs(graphics.scale.x) : -Math.abs(graphics.scale.x)
      graphics.position.set(graphics.lastPosition.x - cameraPosition.x, graphics.lastPosition.y - cameraPosition.y)
    }
    this.app.ticker.add(delta => {
      const cameraPosition = this.camera.getPosition()
      this.entitiesRegistry.update(
        this.networkState.getEntities(),
        entity => createEntity(entity, cameraPosition),
        id => destroyEntity(id),
        entity => updateEntity(entity, cameraPosition),
      )
    })
  }
}
