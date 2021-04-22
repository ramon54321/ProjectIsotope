export function replaceObject(target: object, value: object) {
  for (const key in value) {
    const newTarget = (target as any)[key]
    const newValue = (value as any)[key]
    if (typeof newTarget === 'object') {
      replaceObject(newTarget, newValue)
    } else {
      ;(target as any)[key] = newValue
    }
  }
}
