export class IdManager {
  private static lastId = 0
  static generateId(): string {
    const newId = IdManager.lastId.toFixed(0)
    IdManager.lastId++
    return newId
  }
}
