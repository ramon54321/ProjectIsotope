import EventEmitter from 'events'
import { NSEntity } from '../shared/game/network-state'

export class Selection {
  private selectedEntity: NSEntity | undefined
  private hoverEntity: NSEntity | undefined
  private readonly events = new EventEmitter()
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
