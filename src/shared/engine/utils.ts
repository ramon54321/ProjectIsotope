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

export function doTimes(iterations: number, callback: (iteration: number) => void) {
  for (let i = 0; i < iterations; i++) {
    callback(i)
  }
}
