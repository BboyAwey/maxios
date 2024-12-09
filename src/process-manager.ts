import { AxiosError, AxiosResponse } from 'axios'
import {
  IMaxiosInnerConfig,
  IProcessorsChain,
  TAnyway,
  TError,
  TLoading,
  TProcessorNames,
  TStatusError,
  TSuccess
} from './interfaces'

interface IProcessorSets<Payload, OriginResult, FinalResult> extends TProcessorNames {
  loading: TLoading[]
  statusError: TStatusError<Payload, OriginResult>[],
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
    statusError: [],
    error: [],
    success: [],
    anyway: []
  }

  executeLoadingProcessors () {
    const processors = [...this.#processors.loading].reverse()
    processors.forEach(fn => {
      try { fn(false) } catch (err) { console.warn(err) }
    })
  }

  executeStatusErrorProcessors (err: AxiosError<OriginResult, Payload>) {
    const processors = [...this.#processors.statusError].reverse()
    for (const fn of processors) {
      try {
        if (!fn(err)) break
      } catch (err) { console.warn(err) }
    }
  }

  executeErrorProcessors (response: AxiosResponse<OriginResult, Payload>) {
    const processors = [...this.#processors.error].reverse()
    for (const fn of processors) {
      try {
        if (!fn(response.data)) break
      } catch (err) { console.warn(err) }
    }
  }

  executeSuccessProcessors (result: FinalResult) {
    this.#processors.success.forEach(fn => {
      try { fn(result) } catch (err) { console.warn(err) }
    })
  }

  executeAnywayProcessors () {
    this.#processors.anyway.forEach(fn => {
      try { fn() } catch (err) { console.warn(err) }
    })
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
      statusError: (fn: TStatusError<Payload, OriginResult>) => {
        this.#processors.statusError.push(fn)
        return chain
      },
      error: (fn: TError<OriginResult>) => {
        this.#processors.error.push(fn)
        return chain
      },
      anyway: (fn: TAnyway) => {
        this.#processors.anyway.push(fn)
        return chain
      }
    }

    return chain
  }
}

export default ProcessorManager
