import { EventEmitter } from 'events'

type SyncStateAction = [string, ...any[]]
type SyncStateType = 'WRITER' | 'READER'

export class State {
  #syncStateType: SyncStateType
  #syncStateActions: SyncStateAction[] = []
  #events: EventEmitter = new EventEmitter()
  static eventTriggers: Set<string> = new Set()
  constructor(syncStateType: SyncStateType) {
    this.#syncStateType = syncStateType
  }
  __addEventTrigger(string: string) {
    State.eventTriggers.add(string)
  }
  pushAction(name: string, args: any[]) {
    if (this.#syncStateType === 'READER') return
    this.#syncStateActions.push([name, ...args])
  }
  popActions(): SyncStateAction[] {
    const syncStateActions = [...this.#syncStateActions]
    this.clearActions()
    return syncStateActions
  }
  applyAction(syncStateAction: SyncStateAction) {
    if (this.#syncStateType === 'WRITER') return
    const methodName = syncStateAction[0]
    const method = (this as any)[methodName]
    const args = syncStateAction.slice(1)
    method.bind(this)(...args)
    this.#events.emit(methodName, ...args)
    this.clearActions()
  }
  clearActions() {
    this.#syncStateActions.length = 0
  }
  getEventEmitter(): EventEmitter {
    return this.#events
  }
  update() {
    State.eventTriggers.forEach(event => this.#events.emit(event))
  }
  on(methodName: string, callback: any) {
    this.#events.on(methodName, callback)
  }
  once(methodName: string, callback: () => void) {
    this.#events.once(methodName, callback)
  }
}

export function Pushable() {
  return (target: State, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    target.__addEventTrigger(key)
    descriptor.value = function (...args: any[]) {
      target.pushAction.apply(this, [key, args])
      originalMethod.apply(this, args)
    }
    return descriptor
  }
}
