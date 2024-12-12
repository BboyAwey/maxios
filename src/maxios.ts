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

    if (cacheConfig && daches[cacheConfig.type].has(cacheConfig.key)) {
      // retrieve res from cache
      nextTick(() => {
        this.#processorManager.executeLoadingProcessors()
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
      console.log('add to processing', this.#configManager.apiConfig.axiosConfig?.url)
      const requestID = uuid()
      this.#requestID = requestID
      processingMaxiosInstances.add(this)
      // send request
      request<OriginResult, AxiosResponse<OriginResult, Payload>, Payload>(axiosConfig)
        .then(res => {
          console.log('then --', this.#configManager.apiConfig.axiosConfig?.url)
          console.log('--delete from processing', this.#configManager.apiConfig.axiosConfig?.url)
          if (requestID === this.#requestID) processingMaxiosInstances.delete(this)
          this.#processorManager.executeLoadingProcessors()
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
              console.log('start retry ---',  this.#configManager.apiConfig.axiosConfig?.url)
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
              const hasError = !this.#configManager.getNearestCallback('expect', () => false)(res)
              console.log('has error:', hasError)
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
          console.log('catch-- ', this.#configManager.apiConfig.axiosConfig?.url, axios.isCancel(err))
          if (requestID === this.#requestID) processingMaxiosInstances.delete(this)
          console.log('--delete from processing', this.#configManager.apiConfig.axiosConfig?.url, axios.isCancel(err))

          this.#processorManager.executeLoadingProcessors()
          if (axios.isCancel(err)) return
          
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
    console.log('abort',  this.#configManager.apiConfig.axiosConfig?.url)
    this.#abortController?.abort()
  }

  #startRetry (
    retryLevel: 'api' | 'module' | 'global',
    retryWhenConfig: IRetryWhen<AxiosResponse<OriginResult, Payload>> | IRetryWhen<AxiosError<OriginResult, Payload>>
  ) {
    console.log('--equeue', this.#configManager.apiConfig.axiosConfig?.url)
    retryQueue.enqueue(this)

    if (retryLevel === 'module') {
      // retry all processing instance in the same module
      for (const instance of processingMaxiosInstances) {
        if (instance.module === this.module) {
          console.log('--equeue', instance.#configManager.apiConfig.axiosConfig?.url)
          retryQueue.enqueue(instance)
        }
      }
    } else if (retryLevel === 'global') {
      // retry all processing instance
      for (const instance of processingMaxiosInstances) {
        console.log('--equeue', instance.#configManager.apiConfig.axiosConfig?.url)
        retryQueue.enqueue(instance)
      }
    }

    retryQueue.walk(instance => {
      console.log('--delete from processing', instance.#configManager.apiConfig.axiosConfig?.url)
      processingMaxiosInstances.delete(instance)
      instance.abort()
    })

    const beforeRetry = retryWhenConfig.beforeRetry
    if (beforeRetry instanceof Function) {
      try {
        const beforeRetryResult = beforeRetry()

        if (beforeRetryResult instanceof Promise) {
          beforeRetryResult.then(() => {
            console.log('do retry',  this.#configManager.apiConfig.axiosConfig?.url)
            retryQueue.retry()
          })
        } else {
          console.log('do retry',  this.#configManager.apiConfig.axiosConfig?.url)
          retryQueue.retry()
        }
        beforeRetry()
          
      } catch (err) {
        console.warn('beforeRetry error:', err)
      }
    } else {
      retryQueue.retry()
    }
  }
}
