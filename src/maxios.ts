import axios, { AxiosResponse } from 'axios'
import Dache, { TCacheType } from '@awey/dache'
import { nextTick } from './utils'
import {
  IMaxiosInnerConfig,
  TRequest
} from './interfaces'
import ProcessorManager from './process-manager'
import ConfigManager from './config-manager'
import { RetryQueue } from './retry'

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

  isRetryInstance: boolean = false
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
  }

  request () {
    const axiosConfig = this.#configManager.getFinalAxiosConfig()
    const retryConfig = this.#configManager.getNearestRetryConfig()
    const cacheConfig = this.#configManager.getNearestCacheConfig()
    const request = this.#configManager.getNearestCallback('request', axios.request) as TRequest

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
      processingMaxiosInstances.add(this)
      // send request
      request<OriginResult, AxiosResponse<OriginResult, Payload>, Payload>(axiosConfig)
        .then(res => {
          this.#processorManager.executeLoadingProcessors()
          nextTick(() => {
            if (!res) {
              this.#processorManager.executeAnywayProcessors(res, axiosConfig)
              return
            }
            // use isError indicator
            const hasError = this.#configManager.getNearestCallback('isError', () => false)(res)
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
              // retry when status error
              if (retryConfig?.retry?.when.statusError) {
                this.#startRetry('error')
              } else {
                this.#processorManager.executeErrorProcessors(res)
                this.#processorManager.executeAnywayProcessors(res, axiosConfig)
              }
            }
          })
        })
        .catch(err => {
          // TODO: retry first
          this.#processorManager.executeLoadingProcessors()
          if (axios.isCancel(err)) return
          
          nextTick(() => {
            this.#startRetry('statusError')
            this.#processorManager.executeStatusErrorProcessors(err)
            nextTick(() => {
              // make sure anyway processor is been executed after any other processors
              this.#processorManager.executeAnywayProcessors(err, axiosConfig)
            })
          })
        })
        .finally(() => {
          processingMaxiosInstances.delete(this)
        })
    }

    return this.#processorManager.chain()
  }

  abort () {
    this.#processorManager.abort()
  }

  #startRetry (retryType: 'statusError' | 'error') {
    const retryConfig = this.#configManager.getNearestRetryConfig()

    if (retryConfig?.level === 'api' || !retryConfig?.retry?.retryOthers) {
      // only retry self
      retryQueue.enqueue(this)
    } else if (retryConfig?.level === 'module') {
      // retry all processing instance in the same module
      for (const instance of processingMaxiosInstances) {
        if (instance.module === this.module) {
          retryQueue.enqueue(instance)
        }
      }
    } else if (retryConfig?.level === 'global') {
      for (const instance of processingMaxiosInstances) {
        retryQueue.enqueue(instance)
      }
    }
    const beforeRetry = retryConfig?.retry?.beforeRetry
    if (beforeRetry instanceof Function) {
      try {
        beforeRetry(retryType)
          .then(() => {
            retryQueue.retry()
          })
      } catch (err) {
        console.warn('beforeRetry error:', err)
      }
    } else {
      retryQueue.retry()
    }
  }
}
