import EventEmitter from 'events'
import { NSEntity } from '../shared/game/network-state'

export class Selection {
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
