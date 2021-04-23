import * as PIXI from 'pixi.js'
import { DirtRegistry } from '../../shared/engine/dirt-registry'
import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { addCircle } from './circle'
import { addRect } from './rectangle'
import { addLine } from './line'
import { addTextLive } from './text'
import { Input } from '../input'
import { Camera } from '../camera'

const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight
const HALF_WIDTH = WIDTH / 2
const HALF_HEIGHT = HEIGHT / 2

const PADDING_LEFT = 16
const PADDING_TOP = 16

export class Graphics {
  private readonly app: PIXI.Application
  private readonly networkState: NetworkState
  private readonly ui: any = {}
  private readonly input = new Input()
  private camera!: Camera
  private readonly entitiesRegistry = new DirtRegistry()
  private readonly entitiesMap = new Map<string, PIXI.Graphics>()

  constructor(networkState: NetworkState) {
    this.networkState = networkState
    PIXI.utils.skipHello()
    this.app = new PIXI.Application({
      autoDensity: true,
      resolution: 2,
      antialias: true,
      width: WIDTH,
      height: HEIGHT,
    })
    document.body.appendChild(this.app.view)
    this.app.loader.add('', 'res/insta.png').load(() => this.start())
  }

  start() {
    this.setStageCenter()
    this.createCamera()
    this.createBackground()
    this.createOriginMarkers()
    this.createUI()
    this.createEntities()
  }

  private setStageCenter() {
    this.app.stage.position.set(HALF_WIDTH, HALF_HEIGHT)
  }
  private createCamera() {
    this.camera = new Camera(this.input)
    this.app.ticker.add(delta => this.camera.render(delta))
  }
  private createBackground() {
    this.ui.background = addRect(this.app, 0, 0, WIDTH, HEIGHT)
    this.ui.background.interactive = true
    this.ui.background.on('mouseup', () => console.log('Mouse Up on stage'))
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
  }
  private createEntities() {
    const createEntity = (entity: any, cameraPosition: Vec2) => {
      const graphics = addCircle(this.app, entity.position.x - cameraPosition.x, entity.position.y - cameraPosition.y, 8) as any
      graphics.interactive = true
      graphics.on('mouseup', () => console.log(entity.id, 'Mouse Up'))
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
    const updateEntity = (entity: any, cameraPosition: Vec2) => {
      const graphics = this.entitiesMap.get(entity.id) as any
      if (!graphics) {
        throw new Error('Graphics can not be removed... this should not be possible')
      }
      const dx = entity.position.x - graphics.lastPosition.x
      const dy = entity.position.y - graphics.lastPosition.y
      graphics.lastPosition.x = graphics.lastPosition.x + dx / 16
      graphics.lastPosition.y = graphics.lastPosition.y + dy / 16
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
