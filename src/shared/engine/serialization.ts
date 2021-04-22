const serializationTable = {} as any

interface Serializable {
  __type: string
}

export function Serializable() {
  return <T extends { new (...args: any[]): {} }>(constructor: T) => {
    const tag = constructor.name
    serializationTable[tag] = constructor
    return class extends constructor implements Serializable {
      readonly __type: string = tag
    }
  }
}

export function deserialize<T>(json: string): T {
  const obj = JSON.parse(json, reviver)
  return assignType(obj) as T
}

export function serialize(obj: object): string {
  const json = JSON.stringify(obj, replacer)
  if (!isSerializable(obj)) throw new Error(`Serialization: No type property on ${json}`)
  return json
}

function replacer(key: any, value: any) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    }
  } else {
    return value
  }
}

function reviver(key: any, value: any) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value)
    }
  }
  return value
}

function assignType(obj: any): any {
  const json = JSON.stringify(obj)
  if (!isSerializable(obj)) throw new Error(`Serialization: No type property on ${json}`)
  const prototype = serializationTable[obj.__type]?.prototype
  if (!prototype) throw new Error(`Serialization: No prototype found for '${obj.__type}'`)
  Object.setPrototypeOf(obj, prototype)
  for (const key in obj) {
    const value = (obj as any)[key]
    if (typeof value === 'object' && isSerializable(value)) {
      ;(obj as any)[key] = assignType(value)
    }
  }
  return obj
}

function isSerializable(obj: any): obj is Serializable {
  if (obj.__type === undefined) return false
  return true
}
