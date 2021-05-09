import * as PIXI from 'pixi.js'
import EventEmitter from 'events'
import { NetworkState } from '../shared/game/network-state'
import { Input } from './input'
import { Camera } from './camera'
import { Actions } from './actions'
import { Timer } from './timer'
import { Selection } from './selection'
import { Interaction } from './interaction'
import { Menu } from './menu'
import { GameOptions } from './game-options'
import { ClientState } from './client-state'
import { UserInterface } from './user-interface'
import { EntityManager } from './entity-manager'
import { RenderLayers } from './render-layers'
import { FixtureManager } from './fixture-manager'
import Stats from 'stats.js'

export interface Gtx {
  renderLayers: RenderLayers
  tickTimer: Timer
  networkState: NetworkState
  clientState: ClientState
  selection: Selection
  app: PIXI.Application
  actions: Actions
  events: EventEmitter
  gameOptions: GameOptions
}

export class Graphics {
  private readonly tickTimer = new Timer()
  
  private readonly stats: Stats
  
  private readonly renderLayers: RenderLayers
  private readonly clientState: ClientState
  private readonly selection: Selection
  private readonly networkState: NetworkState
  private readonly actions: Actions
  private readonly events: EventEmitter
  private readonly gameOptions: GameOptions
  private readonly app: PIXI.Application
  private readonly gtx: Gtx

  private input!: Input
  private camera!: Camera
  private entityManager!: EntityManager
  private fixtureManager!: FixtureManager
  private interaction!: Interaction
  private menu!: Menu
  private userInterface!: UserInterface

  constructor(networkState: NetworkState, actions: Actions, events: EventEmitter, gameOptions: GameOptions) {
    this.networkState = networkState
    this.actions = actions
    this.events = events
    this.gameOptions = gameOptions

    // Pixi
    PIXI.utils.skipHello()
    PIXI.settings.SORTABLE_CHILDREN = true
    this.app = new PIXI.Application({
      autoDensity: true,
      resolution: 2,
      antialias: true,
      width: window.innerWidth,
      height: window.innerHeight,
    })
    document.body.appendChild(this.app.view)
    this.app.loader.add(['res/biped1.json', 'res/biped2.json', 'res/blob.png']).load(() => this.start())

    // Render Layers
    this.renderLayers = new RenderLayers()
    this.renderLayers.setup(this.app)

    // Self Init Structures
    this.clientState = new ClientState()
    this.selection = new Selection(this.app, this.renderLayers)

    // Graphics Context
    this.gtx = {
      renderLayers: this.renderLayers,
      tickTimer: this.tickTimer,
      networkState: this.networkState,
      clientState: this.clientState,
      selection: this.selection,
      app: this.app,
      actions: this.actions,
      events: this.events,
      gameOptions: this.gameOptions,
    }

    // Stats
    this.stats = new Stats()
    this.stats.showPanel(0)
    this.stats.dom.style.marginLeft = '20px'
    this.stats.dom.style.marginTop = '20px'
    const setStatsVisible = () => {
      this.stats.dom.style.display = this.gameOptions.getIsDevMode() ? 'block' : 'none'
    }
    setStatsVisible()
    this.gtx.gameOptions.getEventEmitter().on('isDevMode', setStatsVisible)
    document.body.appendChild(this.stats.dom)
  }

  start() {
    // Before Tick
    this.app.ticker.add(() => this.stats.begin())
    this.app.ticker.add(() => this.events.emit('render'))

    // Setup Systems
    this.input = new Input()
    this.camera = new Camera(this.gtx, this.input)
    this.entityManager = new EntityManager(this.gtx, this.camera)
    this.entityManager.start()
    this.fixtureManager = new FixtureManager(this.gtx, this.camera)
    this.fixtureManager.start()
    this.interaction = new Interaction(this.gtx)
    this.menu = new Menu(this.gtx, this.interaction, this.camera, this.input)
    this.userInterface = new UserInterface(this.gtx, this.entityManager, this.fixtureManager)

    // Setup Input Tick
    this.gtx.app.ticker.add(delta => this.tickInput(delta))

    // After Tick
    this.app.ticker.add(() => this.input.reset())
    this.app.ticker.add(() => this.stats.end())
  }

  beforeTick() {
    this.tickTimer.lap()
    this.entityManager?.beforeTick()
  }
  afterTick() {
    this.entityManager?.afterTick()
  }

  classBInstant(payload: any) {
    console.log('Class B Instant')
    // if (payload.kind === undefined) return
    // if (payload.kind.startsWith('ATTACK')) {
    //   const id = IdManager.generateId()
    //   const entity = addCircle(this.app, payload.origin.x, payload.origin.y, 2, this.networkState.getTeams()[payload.team]) as any
    //   entity.payload = payload
    //   entity.worldPosition = new Vec2(entity.position.x, entity.position.y)
    //   const durationSeconds = (Stats.Instants as any)[payload.kind].durationSeconds
    //   this.instantEntities.set(id, [durationSeconds, entity])
    // }
  }

  private tickInput(delta: number) {
    if (this.input.getInputOnce('p')) {
      this.gameOptions.toggleDevMode()
    }
  }

  // private createInstantEntities() {
  //   this.app.ticker.add(delta => {
  //     const deltaTimeSeconds = delta / PIXI.settings.TARGET_FPMS! / 1000
  //     const toRemoveIds: string[] = []
  //     this.instantEntities.forEach((value, key) => {
  //       value[0] -= deltaTimeSeconds
  //       if (value[0] <= 0) toRemoveIds.push(key)
  //     })
  //     toRemoveIds.forEach(id => {
  //       const graphics = this.instantEntities.get(id)![1]
  //       graphics.destroy()
  //       this.instantEntities.delete(id)
  //     })
  //     const cameraWorldPosition = this.camera.getPosition()
  //     this.instantEntities.forEach(value => {
  //       ;(value[1] as any).worldPosition.x += (value[1] as any).payload.velocity.x * deltaTimeSeconds
  //       ;(value[1] as any).worldPosition.y += (value[1] as any).payload.velocity.y * deltaTimeSeconds
  //       ;(value[1] as any).position.set(
  //         -cameraWorldPosition.x + (value[1] as any).worldPosition.x,
  //         -cameraWorldPosition.y + (value[1] as any).worldPosition.y,
  //       )
  //       value[1].alpha -= deltaTimeSeconds * 0.2
  //     })
  //   })
  // }
}
