interface ID {
  id: string
}

export class DirtRegistry {
  private readonly registry: Record<string, boolean> = {} as any
  private clean() {
    for (const key in this.registry) {
      this.registry[key] = false
    }
  }
  private dirtify(key: string) {
    this.registry[key] = true
  }
  private exists(key: string): boolean {
    return this.registry[key] !== undefined
  }
  private getDirtyKeys(): string[] {
    const dirty = []
    for (const key in this.registry) {
      const value = this.registry[key]
      if (!value) {
        dirty.push(key)
      }
    }
    return dirty
  }
  private clearDirty() {
    const dirtyKeys = this.getDirtyKeys()
    dirtyKeys.forEach(key => {
      delete this.registry[key]
    })
  }
  update<E extends ID>(collection: E[], create: (item: E) => void, destroy: (id: string) => void, update: (item: E) => void) {
    this.clean()
    collection.forEach(i => {
      this.exists(i.id) ? update(i) : create(i)
      this.dirtify(i.id)
    })
    this.getDirtyKeys().forEach(destroy)
    this.clearDirty()
  }
}
