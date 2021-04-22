type SyncStateAction = [string, ...any[]]
type SyncStateType = 'WRITER' | 'READER'

export class State {
  #syncStateType: SyncStateType
  #syncStateActions: SyncStateAction[] = []
  constructor(syncStateType: SyncStateType) {
    this.#syncStateType = syncStateType
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
    this.clearActions()
  }
  clearActions() {
    this.#syncStateActions.length = 0
  }
}

export function Pushable() {
  return (target: State, key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value
    descriptor.value = function (...args: any[]) {
      target.pushAction.apply(this, [key, args])
      originalMethod.apply(this, args)
    }
    return descriptor
  }
}
