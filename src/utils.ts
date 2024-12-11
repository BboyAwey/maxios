export const nextTick = (callback: Function) => {
  return new Promise(resolve => resolve(true)).then(() => callback())
}

export const pathJoin = (...pathes: (string | undefined | null)[]): string => {
  if (!pathes.length) return ''

  if (pathes.length === 1) return pathes[0]!

  const rest = pathes
    .slice(1)
    .filter(Boolean)
    .map(path => {
      return path!
        .replace(/\/+/, '/')
        .split('/')
        .filter(Boolean)
        .join('/')
    })
    .join('/')

  return pathes[0]! + (pathes[0]?.endsWith('/') ? '' : '/') + rest
}

export class SelfIncrementID {
  #id: number = 0

  #max: number | null = null

  constructor (max?: number) {
    max && (this.#max = max)
  }

  generate () {
    if (!this.#max || this.#id <= this.#max) {
      return this.#id++
    } else {
      return this.#id = 0
    }
  }
}

// copy from skywalking client sdk
// see detail at https://github.com/apache/skywalking-client-js/blob/master/src/services/uuid.ts
export const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0 // 0 ~ 15: 00000000 ~ 11111111
    const v = c === 'x' ? r : (r & 0x3) | 0x8 // c === 'x' ? r : (r & 111) | 1110
    return v.toString(16)
  })
}