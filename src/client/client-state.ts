import EventEmitter from 'events'

export class ClientState {
  private team: number = 0
  setTeam(value: number) {
    this.team = value
  }
  getTeam(): number {
    return this.team
  }

  private readonly events = new EventEmitter()
  getEventEmitter(): EventEmitter {
    return this.events
  }
}
