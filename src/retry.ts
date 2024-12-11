import { Maxios } from './maxios'

export class RetryQueue {
  #queue: Maxios[] = []

  enqueue (maxios: Maxios) {
    this.#queue.push(maxios)
  }

  retry () {
    if (this.#queue.length === 0) return
    for (const instance of this.#queue) {
      instance.request()
    }
    this.#queue = []
  }

  getQueue () {
    return this.#queue
  }
}