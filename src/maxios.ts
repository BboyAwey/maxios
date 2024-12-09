import axios, { AxiosResponse } from 'axios'
import Dache, { TCacheType } from '@awey/dache'
import { nextTick } from './utils'
import {
  IMaxiosInnerConfig,
  TRequest
} from './interfaces'
import ProcessorManager from './process-manager'
import ConfigManager from './config-manager'

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

  constructor (config: IMaxiosConstructorConfig<Payload, OriginResult, FinalResult>) {
    // save config
    this.#configManager = new ConfigManager<Payload, OriginResult, FinalResult>(config)

    // load processors
    this.#processorManager.loadProcessorFromMaxiosConfig(ConfigManager.getGlobalConfig())
    this.#processorManager.loadProcessorFromMaxiosConfig(this.#configManager.moduleConfig)
    this.#processorManager.loadProcessorFromMaxiosConfig(this.#configManager.apiConfig)
  }

  request () {
    const axiosConfig = this.#configManager.getAxiosConfig()
    const cacheConfig = this.#configManager.getNearestCacheConfig()
    const request = this.#configManager.getNearestCallback('request', axios.request) as TRequest

    if (cacheConfig && daches[cacheConfig.type].has(cacheConfig.key)) {
      // retrieve res from cache
      nextTick(() => {
        this.#processorManager.executeLoadingProcessors()
        nextTick(() => {
          this.#processorManager.executeSuccessProcessors(daches[cacheConfig.type].get(cacheConfig.key)!)
          nextTick(() => {
            // make sure anyway processor is been executed after any other processors
            this.#processorManager.executeAnywayProcessors()
          })
        })
      })
    } else {
      // send request
      request<OriginResult, AxiosResponse<OriginResult, Payload>, Payload>(axiosConfig)
        .then(res => {
          this.#processorManager.executeLoadingProcessors()
          nextTick(() => {
            if (!res) return
            // use indicator
            const hasBizError = !this.#configManager.getNearestCallback('indicator', () => true)(res)
            if (!hasBizError) {
              // use extractor
              const extractor = this.#configManager.getNearestCallback(
                'extractor',
                (res: AxiosResponse<OriginResult, Payload>) => res.data
              )
              let extractRes: FinalResult | undefined

              extractRes = extractor(res)
              this.#processorManager.executeSuccessProcessors(extractRes as FinalResult)

              // cache result
              if (cacheConfig) {
                daches[cacheConfig.type].set(cacheConfig.key, extractRes)
              }
            } else {
              this.#processorManager.executeBizErrorProcessors(res)
            }
            nextTick(() => {
              // make sure anyway processor is been executed after any other processors
              this.#processorManager.executeAnywayProcessors()
            })
          })
        })
        .catch(err => {
          this.#processorManager.executeLoadingProcessors()
          if (axios.isCancel(err)) return
          
          nextTick(() => {
            this.#processorManager.executeRequestErrorProcessors(err)
            nextTick(() => {
              // make sure anyway processor is been executed after any other processors
              this.#processorManager.executeAnywayProcessors()
            })
          })
        })
    }

    return this.#processorManager.chain()
  }
}
