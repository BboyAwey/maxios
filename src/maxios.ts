import axios, { AxiosError, AxiosResponse } from 'axios'
import Dache, { TCacheType } from '@awey/dache'
import { nextTick, uuid } from './utils'
import {
  IMaxiosInnerConfig,
  IRetryWhen,
  TRequest
} from './interfaces'
import ProcessorManager from './process-manager'
import ConfigManager from './config-manager'
import { RetryQueue } from './retry'

const DEFAULT_MAXIMUM_RETRY_COUNT = 1

const processingMaxiosInstances: Set<Maxios> = new Set()
const retryQueue = new RetryQueue()

export interface IMaxiosConstructorConfig <
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  moduleConfig: IMaxiosInnerConfig | (() => IMaxiosInnerConfig)
  apiConfig: IMaxiosInnerConfig<Payload, OriginResult, FinalResult> | (() => IMaxiosInnerConfig<Payload, OriginResult, FinalResult>)
}

const daches: Record<TCacheType, Dache> = {
  memory: new Dache('memory', 'maxios'),
  session: new Dache('session', 'maxios'),
  local: new Dache('local', 'maxios')
}

export class Maxios<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  #configManager: ConfigManager<Payload, OriginResult, FinalResult>
  #processorManager = new ProcessorManager<Payload, OriginResult, FinalResult>()
  #abortController: AbortController | undefined

  #retryCount: number = 0
  #requestID: string = ''

  module: string | number | undefined = undefined

  constructor (
    config: IMaxiosConstructorConfig<Payload, OriginResult, FinalResult>,
    module?: string | number
  ) {
    // save config
    this.#configManager = new ConfigManager<Payload, OriginResult, FinalResult>(config)
    this.module = module

    // load processors
    this.#processorManager.loadProcessorFromMaxiosConfig(ConfigManager.getGlobalConfig())
    this.#processorManager.loadProcessorFromMaxiosConfig(this.#configManager.moduleConfig)
    this.#processorManager.loadProcessorFromMaxiosConfig(this.#configManager.apiConfig)

    // give a chance to processor manager for letting users use abort() on chain
    this.#processorManager.onAbort(() => {
      this.#abortController?.abort()
    })
  }

  request () {
    const axiosConfig = this.#configManager.getFinalAxiosConfig()
    const retryConfig = this.#configManager.getNearestRetryConfig()
    const cacheConfig = this.#configManager.getNearestCacheConfig()
    const request = this.#configManager.getNearestCallback('request', axios.request) as TRequest

    // init abort controller on every request for multiple retry cancel
    this.#abortController = new AbortController()
    axiosConfig.signal = this.#abortController.signal
    
    nextTick(() => {
      this.#processorManager.executeLoadingProcessors(true)
    })


    if (cacheConfig && daches[cacheConfig.type].has(cacheConfig.key)) {
      // retrieve res from cache
      nextTick(() => {
        this.#processorManager.executeLoadingProcessors(false)
        nextTick(() => {
          const result = daches[cacheConfig.type].get(cacheConfig.key)!
          this.#processorManager.executeSuccessProcessors(result)
          nextTick(() => {
            // make sure anyway processor is been executed after any other processors
            this.#processorManager.executeAnywayProcessors(result, axiosConfig)
          })
        })
      })
    } else {
      const requestID = uuid()
      this.#requestID = requestID
      processingMaxiosInstances.add(this)
      // send request
      request<OriginResult, AxiosResponse<OriginResult, Payload>, Payload>(axiosConfig)
        .then(res => {
          if (requestID === this.#requestID) processingMaxiosInstances.delete(this)
          this.#processorManager.executeLoadingProcessors(false)
          nextTick(() => {
            // retry when success
            if (
              retryConfig?.retryWhen.requestSuccess &&
              (this.#retryCount < (retryConfig.retryWhen.requestSuccess.maximumCount || DEFAULT_MAXIMUM_RETRY_COUNT)) &&
              (
                retryConfig.retryWhen.requestSuccess.condition
                  ? retryConfig.retryWhen.requestSuccess.condition(res)
                  : true
              )
            ) {
              this.#retryCount++
              this.#startRetry(
                retryConfig.retryWhen.requestSuccess.retryOthers === 'module'
                  ? 'module'
                  : retryConfig.retryWhen.requestSuccess.retryOthers === 'global'
                    ? 'global'
                    : retryConfig.level,
                retryConfig.retryWhen.requestSuccess
              )
            } else {
              if (!res) {
                this.#processorManager.executeAnywayProcessors(res, axiosConfig)
                return
              }
              // check if the response is expected
              const hasError = !this.#configManager.getNearestCallback('expect', () => true)(res)
              if (!hasError) {
                // use extractor
                const extractor = this.#configManager.getNearestCallback(
                  'extractor',
                  (res: AxiosResponse<OriginResult, Payload>) => res.data
                )
                let extractRes: FinalResult | undefined

                extractRes = extractor(res)
                this.#processorManager.executeSuccessProcessors(extractRes as FinalResult)
                this.#processorManager.executeAnywayProcessors(res, axiosConfig)

                // cache result
                if (cacheConfig) {
                  daches[cacheConfig.type].set(cacheConfig.key, extractRes)
                }
              } else {
                this.#processorManager.executeErrorProcessors(res)
                this.#processorManager.executeAnywayProcessors(res, axiosConfig)
              }
            }
          })
        })
        .catch(err => {
          if (requestID === this.#requestID) processingMaxiosInstances.delete(this)

          this.#processorManager.executeLoadingProcessors(false)
          if (axios.isCancel(err)) {
            this.#processorManager.executeAnywayProcessors(err as AxiosError, axiosConfig)
          }
          
          nextTick(() => {
            if (
              retryConfig?.retryWhen.requestError &&
              this.#retryCount < (retryConfig.retryWhen.requestError?.maximumCount || DEFAULT_MAXIMUM_RETRY_COUNT) &&
              (
                retryConfig.retryWhen.requestError.condition
                  ? retryConfig.retryWhen.requestError.condition(err)
                  : true
              )
            ) {
              this.#retryCount++
              this.#startRetry(
                retryConfig.retryWhen.requestError.retryOthers === 'module'
                    ? 'module'
                    : retryConfig.retryWhen.requestError.retryOthers === 'global'
                      ? 'global'
                      : retryConfig.level,
                retryConfig.retryWhen.requestError
              )
            } else {
              this.#processorManager.executeRequestErrorProcessors(err)
              nextTick(() => {
                // make sure anyway processor is been executed after any other processors
                this.#processorManager.executeAnywayProcessors(err, axiosConfig)
              })
            }
          })
        })
    }

    return this.#processorManager.chain()
  }

  abort () {
    this.#abortController?.abort()
  }

  #startRetry (
    retryLevel: 'api' | 'module' | 'global',
    retryWhenConfig: IRetryWhen<AxiosResponse<OriginResult, Payload>> | IRetryWhen<AxiosError<OriginResult, Payload>>
  ) {
    retryQueue.enqueue(this)

    if (retryLevel === 'module') {
      // retry all processing instance in the same module
      for (const instance of processingMaxiosInstances) {
        if (instance.module === this.module) {
          retryQueue.enqueue(instance)
        }
      }
    } else if (retryLevel === 'global') {
      // retry all processing instance
      for (const instance of processingMaxiosInstances) {
        retryQueue.enqueue(instance)
      }
    }

    retryQueue.walk(instance => {
      processingMaxiosInstances.delete(instance)
      instance.abort()
    })

    const beforeRetry = retryWhenConfig.beforeRetry
    if (beforeRetry instanceof Function) {
      try {
        const beforeRetryResult = beforeRetry()

        if (beforeRetryResult instanceof Promise) {
          beforeRetryResult.then(() => {
            retryQueue.retry()
          }).finally(() => {
            retryQueue.clear()
          })
        } else {
          if (beforeRetryResult === false) {
            retryQueue.clear()
          } else {
            retryQueue.retry()
          }
        }
      } catch (err) {
        console.warn('beforeRetry error:', err)
        retryQueue.clear()
      }
    } else {
      retryQueue.retry()
    }
  }
}
