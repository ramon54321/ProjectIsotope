import { readFileSync, existsSync, writeFileSync } from 'fs'
import EventEmitter from 'events'
import { replaceObject } from '../shared/engine/utils'

export class GameOptions {
  private isDevMode: boolean = false
  toggleDevMode() {
    this.isDevMode = !this.isDevMode
    this.#events.emit('isDevMode')
    if (!this.isDevMode) {
      this.toggleZoomedOut()
    }
  }
  getIsDevMode(): boolean {
    return this.isDevMode
  }

  private isZoomedOut: boolean = false
  toggleZoomedOut() {
    if (!this.isDevMode) {
      this.isZoomedOut = false
    } else {
      this.isZoomedOut = !this.isZoomedOut
    }
    this.#events.emit('isZoomedOut')
  }
  getIsZoomedOut(): boolean {
    return this.isZoomedOut
  }

  private shouldShowTutorial: boolean = true
  getShouldShowTutorial(): boolean {
    return this.shouldShowTutorial
  }
  setShouldShowTutorial(value: boolean) {
    this.shouldShowTutorial = value
    this.#events.emit('shouldShowTutorial')
  }

  readonly #events = new EventEmitter()
  getEventEmitter(): EventEmitter {
    return this.#events
  }
  readonly #path = 'client-game-options.json'
  constructor() {
    this.load()
    window.addEventListener('beforeunload', () => this.save())
  }
  load() {
    if (existsSync(this.#path)) {
      console.log('Loading...')
      replaceObject(this, JSON.parse(readFileSync(this.#path, 'utf8')))
    }
  }
  save() {
    console.log('Saving...')
    writeFileSync(this.#path, JSON.stringify(this, null, 2))
  }
}
