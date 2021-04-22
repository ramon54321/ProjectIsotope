export function replaceObject(target: object, value: object) {
  for (const key in value) {
    const newTarget = (target as any)[key]
    const newValue = (value as any)[key]
    if (newValue instanceof Map) {
      ;(target as any)[key] = newValue
    } else if (typeof newTarget === 'object') {
      replaceObject(newTarget, newValue)
    } else {
      ;(target as any)[key] = newValue
    }
  }
}
