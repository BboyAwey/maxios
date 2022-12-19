import axios, { AxiosRequestConfig } from 'axios'
import { IMaxiosConfig, TNearestCallbackName } from './interfaces'
import { IMaxiosConstructorConfig } from './maxios'
import { pathJoin } from './utils'

class ConfigManager<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  static source = axios.CancelToken.source()

  static globalConfig: IMaxiosConfig | (() => IMaxiosConfig) = {}

  static getGlobalConfig = (): IMaxiosConfig => {
    if (ConfigManager.globalConfig instanceof Function) {
      return ConfigManager.globalConfig()
    } else return ConfigManager.globalConfig
  }


  #originModuleConfig: IMaxiosConfig | (() => IMaxiosConfig)
  #originApiConfig: IMaxiosConfig<Payload, OriginResult, FinalResult> | (() => IMaxiosConfig<Payload, OriginResult, FinalResult>)

  get moduleConfig (): IMaxiosConfig {
    if (this.#originModuleConfig instanceof Function) {
      return this.#originModuleConfig()
    } else {
      return this.#originModuleConfig
    }
  }

  get apiConfig (): IMaxiosConfig<Payload, OriginResult, FinalResult> {
    if (this.#originApiConfig instanceof Function) {
      return this.#originApiConfig()
    } else return this.#originApiConfig
  }

  constructor (config: IMaxiosConstructorConfig<Payload, OriginResult, FinalResult>) {
    this.#originModuleConfig = config.moduleConfig
    this.#originApiConfig = config.apiConfig
  }

  getNearestCallback (name: TNearestCallbackName, defaultCallback: Function) {
    const res = typeof this.apiConfig[name] === 'function'
      ? this.apiConfig[name]
      : typeof this.moduleConfig[name] === 'function'
        ? this.moduleConfig[name]
        : typeof ConfigManager.getGlobalConfig()[name] === 'function'
          ? ConfigManager.getGlobalConfig()[name]
          : defaultCallback

    return res!
  }

  getNearestCacheConfig () {
    return this.apiConfig.cache ||
      this.moduleConfig.cache ||
      ConfigManager.getGlobalConfig().cache
  }

  getAxiosConfig () {
    const axiosConfig: AxiosRequestConfig = {
      ...ConfigManager.getGlobalConfig().axiosConfig,
      ...this.moduleConfig.axiosConfig,
      ...this.apiConfig.axiosConfig,
      baseURL: pathJoin(
        ConfigManager.getGlobalConfig().axiosConfig?.baseURL,
        this.moduleConfig.axiosConfig?.baseURL,
        this.apiConfig.axiosConfig?.baseURL
      ),
      headers: {
        ...ConfigManager.getGlobalConfig().axiosConfig?.headers,
        ...this.moduleConfig.axiosConfig?.headers,
        ...this.apiConfig.axiosConfig?.headers
      },
      params: {
        ...ConfigManager.getGlobalConfig().axiosConfig?.params,
        ...this.moduleConfig.axiosConfig?.params,
        ...this.apiConfig.axiosConfig?.params
      }
    }

    // data could be string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
    const dataList = [
      this.apiConfig.axiosConfig?.data,
      this.moduleConfig.axiosConfig?.data,
      ConfigManager.getGlobalConfig().axiosConfig?.data
    ]

    let finalData: any = {}
    for (const d of dataList) {
      if (d) {
        // data is not plain object
        if ((d as any).toString() !== '[object Object]') {
          finalData = d
          break
        } else {
          finalData = { ...finalData, ...d }
        }
      } else continue
    }

    axiosConfig.data = finalData

    if (
      ConfigManager.getGlobalConfig().cancelable !== false &&
      this.moduleConfig.cancelable !== false &&
      this.apiConfig.cancelable !== false
    ) {
      axiosConfig.cancelToken = ConfigManager.source.token
    }

    return axiosConfig
  }
}

export default ConfigManager
