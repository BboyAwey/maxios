import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  IMaxiosInnerConfig,
  IProcessorsChain,
  TAnyway,
  TError,
  TLoading,
  TProcessorNames,
  TRequestError,
  TSuccess
} from './interfaces'

interface IProcessorSets<Payload, OriginResult, FinalResult> extends TProcessorNames {
  loading: TLoading[]
  requestError: TRequestError<Payload, OriginResult>[],
  error: TError<OriginResult>[]
  success: TSuccess<FinalResult>[]
  anyway: TAnyway[]
}

class ProcessorManager<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  #processors: IProcessorSets<Payload, OriginResult, FinalResult> = {
    loading: [],
    requestError: [],
    error: [],
    success: [],
    anyway: []
  }

  #abortCallback = () => {}

  executeLoadingProcessors () {
    const processors = [...this.#processors.loading].reverse()
    for (const fn of processors) {
      try {
        if (fn(false) === false) break
      } catch (err) { console.warn(err) }
    }
  }

  executeRequestErrorProcessors (err: AxiosError<OriginResult, Payload>) {
    const processors = [...this.#processors.requestError].reverse()
    for (const fn of processors) {
      try {
        if (fn(err) === false) break
      } catch (err) { console.warn(err) }
    }
  }

  executeErrorProcessors (response: AxiosResponse<OriginResult, Payload>) {
    const processors = [...this.#processors.error].reverse()
    for (const fn of processors) {
      try {
        if (fn(response.data) === false) break
      } catch (err) { console.warn(err) }
    }
  }

  executeSuccessProcessors (result: FinalResult) {
    const processors = [...this.#processors.success].reverse()
    for (const fn of processors) {
      try {
        if (fn(result) === false) break
      } catch (err) { console.warn(err) }
    }
  }

  executeAnywayProcessors (res?: AxiosResponse | AxiosError, axiosConfig?: AxiosRequestConfig<Payload>) {
    const processors = [...this.#processors.anyway].reverse()
    for (const fn of processors) {
      try {
        if (fn(res, axiosConfig) === false) break
      } catch (err) { console.warn(err) }
    }
  }

  loadProcessorFromMaxiosConfig (config: IMaxiosInnerConfig) {
    for (const key in this.#processors) {
      const k = key as keyof TProcessorNames
      if (config[k] instanceof Function) {
        this.#processors[k].push(config[k] as any)
        // if it is loading processor, execute it first
        k === 'loading' && (config[k]!)(true)
      }
    }
  }

  onAbort (fn: () => void) {
    this.#abortCallback = fn
  }

  chain () {
    const chain: IProcessorsChain<Payload, OriginResult, FinalResult> = {
      loading: (fn: TLoading) => {
        // execute loading processor first
        fn(true)
        this.#processors.loading.push(fn)
        return chain
      },
      success: (fn: TSuccess<FinalResult>) => {
        this.#processors.success.push(fn)
        return chain
      },
      requestError: (fn: TRequestError<Payload, OriginResult>) => {
        this.#processors.requestError.push(fn)
        return chain
      },
      error: (fn: TError<OriginResult>) => {
        this.#processors.error.push(fn)
        return chain
      },
      anyway: (fn: TAnyway) => {
        this.#processors.anyway.push(fn)
        return chain
      },
      abort: () => {
        this.#abortCallback()
        return chain
      }
    }

    return chain
  }
}

export default ProcessorManager
