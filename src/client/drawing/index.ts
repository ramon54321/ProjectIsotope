import * as PIXI from 'pixi.js'
import { DirtRegistry } from '../../shared/engine/dirt-registry'
import { Vec2 } from '../../shared/engine/math'
import { NetworkState } from '../../shared/game/network-state'
import { addCircle } from './circle'
import { addLine } from './line'
import { addTextLive } from './text'

class Input {
  private readonly inputDown: any = {}
  private readonly inputOnce: any = {}
  constructor() {
    this.inputDown = {}
    this.inputOnce = {}
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.inputDown[e.key] = true
      this.inputOnce[e.key] = true
    })
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.inputDown[e.key] = false
    })
    window.addEventListener('mousedown', (e: MouseEvent) => {
      this.inputDown['click'] = true
      this.inputOnce['click'] = true
    })
    window.addEventListener('mouseup', (e: MouseEvent) => {
      this.inputDown['click'] = false
    })
  }
  getInputDown(key: string) {
    return this.inputDown[key]
  }
  getInputOnce(key: string) {
    return this.inputOnce[key]
  }
}

class Camera {
  private readonly input: Input
  private x: number = 0
  private y: number = 0
  constructor(input: Input) {
    this.input = input
  }
  render(delta: number) {
    if (this.input.getInputDown('a')) {
      this.x -= 16 * delta
    } else if (this.input.getInputDown('d')) {
      this.x += 16 * delta
    }
    if (this.input.getInputDown('w')) {
      this.y -= 16 * delta
    } else if (this.input.getInputDown('s')) {
      this.y += 16 * delta
    }
  }
  getPosition(): Vec2 {
    return { x: this.x, y: this.y }
  }
}

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
  private readonly camera = new Camera(this.input)
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
    this.app.loader.add('', 'res/insta.png').load(() => {
      this.start()
      this.app.ticker.add(delta => this.render(delta))
    })
  }
  start() {
    this.setStageCenter()
    this.ui.worldName = addTextLive(
      this.app,
      this.networkState,
      'setWorldName',
      () => this.networkState.getWorldName(),
      -HALF_WIDTH + PADDING_LEFT,
      -HALF_HEIGHT + PADDING_TOP,
      0,
    )
    this.ui.origin = addCircle(this.app, 0, 0, 8)
    this.ui.originVertical = addLine(this.app, 0, -HALF_HEIGHT, 0, HEIGHT, 1, 0xeeeeee, 0.5)
    this.ui.originHorizontal = addLine(this.app, -HALF_WIDTH, 0, WIDTH, 0, 1, 0xeeeeee, 0.5)
  }
  render(delta: number) {
    this.camera.render(delta)
    const cameraPosition = this.camera.getPosition()
    this.ui.origin.position.set(-cameraPosition.x, -cameraPosition.y)
    this.ui.originVertical.position.x = -cameraPosition.x
    this.ui.originHorizontal.position.y = -cameraPosition.y
    this.entitiesRegistry.update(
      this.networkState.getEntities(),
      entity => this.createEntity(entity, cameraPosition),
      id => this.destroyEntity(id),
      entity => this.updateEntity(entity, cameraPosition),
    )
  }
  private createEntity(entity: any, cameraPosition: Vec2) {
    const graphics = addCircle(this.app, entity.position.x - cameraPosition.x, entity.position.y - cameraPosition.y, 8) as any
    graphics.lastPosition = {
      x: entity.position.x,
      y: entity.position.y,
    }
    this.entitiesMap.set(entity.id, graphics)
  }
  private destroyEntity(id: string) {
    const graphics = this.entitiesMap.get(id)
    if (!graphics) {
      throw new Error('Graphics can not be removed... this should not be possible')
    }
    this.app.stage.removeChild(graphics)
    this.entitiesMap.delete(id)
  }
  private updateEntity(entity: any, cameraPosition: Vec2) {
    const graphics = this.entitiesMap.get(entity.id) as any
    if (!graphics) {
      throw new Error('Graphics can not be removed... this should not be possible')
    }
    const dx = entity.position.x - graphics.lastPosition.x
    const dy = entity.position.y - graphics.lastPosition.y
    graphics.lastPosition.x = graphics.lastPosition.x + dx / 8
    graphics.lastPosition.y = graphics.lastPosition.y + dy / 8
    graphics.position.set(graphics.lastPosition.x - cameraPosition.x, graphics.lastPosition.y - cameraPosition.y)
  }
  private setStageCenter() {
    this.app.stage.position.set(HALF_WIDTH, HALF_HEIGHT)
  }
}
