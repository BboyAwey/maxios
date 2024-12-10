import { Maxios } from './maxios'

export class RetryQueue {
  #queue: Maxios[] = []

  get size () {
    return this.#queue.length
  }

  enqueue (maxios: Maxios) {
    // refuse to retry the same instance again
    if (maxios.isRetryInstance) return
    // stop the instance process first
    maxios.abort()
    // mark the instance as a retry instance
    maxios.isRetryInstance = true
    // enqueue the instance to the queue
    this.#queue.push(maxios)
  }

  retry () {
    if (this.#queue.length === 0) return
    const maxios = this.#queue.shift()!
    maxios.request()
  }
}