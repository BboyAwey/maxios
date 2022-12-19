import { AxiosError, AxiosResponse } from 'axios'
import {
  IMaxiosConfig,
  IProcessorsChain,
  TAnyway,
  TBizError,
  TLoading,
  TRequestError,
  TSuccess
} from './interfaces'

class ProcessorManager<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  #loadingFns: TLoading[] = []
  #requestErrorFns: TRequestError<Payload, OriginResult>[] = []
  #bizErrorFns: TBizError<OriginResult>[] = []
  #successFns: TSuccess<FinalResult>[] = []
  #anywayFns: TAnyway[] = []

  executeLoadingProcessors () {
    this.#loadingFns.forEach(fn => {
      try {
        fn(false)
      } catch (err) { console.warn(err) }
    })
  }

  executeRequestErrorProcessors (err: AxiosError<OriginResult, Payload>) {
    for (const fn of this.#requestErrorFns) {
      try {
        if (!fn(err)) break
      } catch (err) { console.warn(err) }
    }
  }

  executeBizErrorProcessors (response: AxiosResponse<OriginResult, Payload>) {
    for (const fn of this.#bizErrorFns) {
      try {
        if (!fn(response.data)) break
      } catch (err) { console.warn(err) }
    }
  }

  executeSuccessProcessors (result: FinalResult) {
    this.#successFns.forEach(fn => {
      try {
        fn(result)
      } catch (err) { console.warn(err) }
    })
  }

  executeAnywayProcessors () {
    this.#anywayFns.forEach(fn => {
      try { fn() } catch (err) { console.warn(err) }
    })
  }

  addLoadingProcessor (arg: TLoading) {
    this.#loadingFns.push(arg)
    arg(true)
  }

  addSuccessProcessor (fn: TSuccess<FinalResult>) {
    this.#successFns.push(fn)
  }

  addRequestErrorProcessor (fn: TRequestError<Payload, OriginResult>) {
    this.#requestErrorFns.unshift(fn)
  }

  addBizErrorProcessor (fn: TBizError<OriginResult>) {
    this.#bizErrorFns.unshift(fn)
  }

  addAnywayProcessor (fn: TAnyway) {
    this.#anywayFns.push(fn)
  }

  loadProcessorFromMaxiosConfig (config: IMaxiosConfig) {
    if (typeof config.loading === 'function') this.addLoadingProcessor(config.loading)
    if (typeof config.error === 'function') this.addRequestErrorProcessor(config.error)
    if (typeof config.bizError === 'function') this.addBizErrorProcessor(config.bizError)
    if (typeof config.success === 'function') this.addSuccessProcessor(config.success)
    if (typeof config.anyway === 'function') this.addAnywayProcessor(config.anyway)
  }

  chain () {
    const chain: IProcessorsChain<Payload, OriginResult, FinalResult> = {
      loading: (arg: TLoading) => {
        this.addLoadingProcessor(arg)
        return chain
      },
      success: (fn: TSuccess<FinalResult>) => {
        this.addSuccessProcessor(fn)
        return chain
      },
      error: (fn: TRequestError<Payload, OriginResult>) => {
        this.addRequestErrorProcessor(fn)
        return chain
      },
      bizError: (fn: TBizError<OriginResult>) => {
        this.addBizErrorProcessor(fn)
        return chain
      },
      anyway: (fn: TAnyway) => {
        this.addAnywayProcessor(fn)
        return chain
      }
    }

    return chain
  }
}

export default ProcessorManager
