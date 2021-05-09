import EventEmitter from 'events'
import { NSEntity } from '../shared/game/network-state'
import * as PIXI from 'pixi.js'
import { createRect } from './drawing/rectangle'
import { RenderLayers } from './render-layers'

export class Selection {
  private readonly app: PIXI.Application
  private readonly renderLayers: RenderLayers
  private selectedEntity: NSEntity | undefined
  private hoverEntity: NSEntity | undefined
  private readonly events = new EventEmitter()
  constructor(app: PIXI.Application, renderLayers: RenderLayers) {
    this.app = app
    this.renderLayers = renderLayers
    const width =  this.app.renderer.width / this.app.renderer.resolution
    const height =  this.app.renderer.height / this.app.renderer.resolution
    const background = createRect(0, 0, width, height, { colorName: 'BackgroundHitbox' })
    background.position.set(width / 2, height / 2)
    const renderLayer = this.renderLayers.getRenderLayer('Background')
    renderLayer.addChild(background)
    renderLayer.interactive = true
    renderLayer.on('mouseup', () => this.clearSelectedEntity())
    renderLayer.on('mouseover', () => this.clearHoverEntity())
  }
  getEventEmitter(): EventEmitter {
    return this.events
  }
  getSelectedEntity(): NSEntity | undefined {
    return this.selectedEntity
  }
  getHoverEntity(): NSEntity | undefined {
    return this.hoverEntity
  }
  setSelectedEntity(entity: NSEntity) {
    this.selectedEntity = entity
    this.events.emit('entity')
    this.events.emit('entity-set')
  }
  setHoverEntity(entity: NSEntity) {
    this.hoverEntity = entity
    this.events.emit('entity')
    this.events.emit('entity-hover')
    this.events.emit('entity-hover-set')
  }
  clearSelectedEntity() {
    this.selectedEntity = undefined
    this.events.emit('entity')
    this.events.emit('entity-clear')
  }
  clearHoverEntity() {
    this.hoverEntity = undefined
    this.events.emit('entity')
    this.events.emit('entity-hover')
    this.events.emit('entity-hover-clear')
  }
}
