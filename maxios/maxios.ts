import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import Dache, { TCacheType } from '@awey/dache'

type TLoading = (status: boolean) => void
type TRequestError<Payload, Result> = (error: AxiosError<Result, Payload>) => void | boolean
type TBizError<Result> = (data: Result) => void | boolean
type TSuccess<Result> = (data: Result) => void
type TAnyway = () => void

interface IProcessors<Payload, OriginResult, FinalResult> {
  loading?: TLoading
  error?: TRequestError<Payload, OriginResult>
  bizError?: TBizError<OriginResult>
  success?: TSuccess<FinalResult>
  anyway?: TAnyway
}

interface IProcessorsChain<Payload, OriginResult, FinalResult> {
  loading: (arg: TLoading) => IProcessorsChain<Payload, OriginResult, FinalResult>
  success: (fn: TSuccess<FinalResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  error: (fn: TRequestError<Payload, OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  bizError: (fn: TBizError<OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  anyway: (fn: TAnyway) => IProcessorsChain<Payload, OriginResult, FinalResult>
}

type TIndicator<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => boolean

type TExtractor<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => unknown

type TRequest = <T = unknown, R = AxiosResponse<T>, D = any> (config: AxiosRequestConfig<D>) => Promise<R>

type TNearestCallbackName = 'extractor' | 'indicator' | 'request'

export interface IMaxiosConfig<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> extends IProcessors<Payload, OriginResult, FinalResult>, Partial<Record<TNearestCallbackName, any>> {
  axiosConfig?: AxiosRequestConfig<Payload>
  indicator?: TIndicator<Payload, OriginResult>
  extractor?: TExtractor<Payload, OriginResult>
  request?: TRequest
  cache?: {
    type: TCacheType
    key: string
  }
  cancelable?: boolean
}

let globalConfig: IMaxiosConfig | (() => IMaxiosConfig) = {}

const getGlobalConfig = (): IMaxiosConfig => {
  if (globalConfig instanceof Function) {
    return globalConfig()
  } else return globalConfig
}

export const global = <OriginResult = any> (
  config: IMaxiosConfig<unknown, OriginResult> | (() => IMaxiosConfig<unknown, OriginResult>)
) => {
  globalConfig = config
}

export const modulize = <OriginResult = any> (
  config: IMaxiosConfig<unknown, OriginResult> | (() => IMaxiosConfig<unknown, OriginResult>) = {}
): (<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> (
  apiConfig?: IMaxiosConfig<Payload, OriginResult, FinalResult> | (() => IMaxiosConfig<Payload, OriginResult, FinalResult>)
) => IProcessorsChain<Payload, OriginResult, FinalResult>) => {
  return (apiConfig) => {
    return new Maxios({
      moduleConfig: config,
      apiConfig: apiConfig || {}
    }).request()
  }
}

function nextTick (callback: Function): void {
  new Promise(resolve => resolve(true)).then(() => callback())
}

class MaxiosProcessorManager<
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
    this.#anywayFns.unshift(fn)
  }

  loadProcessorFromMaxiosConfig (config: IMaxiosConfig) {
    if (typeof config.loading === 'function') this.addLoadingProcessor(config.loading)
    if (typeof config.error === 'function') this.addRequestErrorProcessor(config.error)
    if (typeof config.bizError === 'function') this.addBizErrorProcessor(config.bizError)
    if (typeof config.success === 'function') this.addSuccessProcessor(config.success)
    if (typeof config.anyway === 'function') this.addSuccessProcessor(config.anyway)
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

interface IMaxiosConstructorConfig <
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  moduleConfig: IMaxiosConfig | (() => IMaxiosConfig)
  apiConfig: IMaxiosConfig<Payload, OriginResult, FinalResult> | (() => IMaxiosConfig<Payload, OriginResult, FinalResult>)
}

function pathJoin (...pathes: (string | undefined | null)[]): string {
  if (!pathes.length) return ''

  if (pathes.length === 1) return pathes[0]!

  const rest = pathes
    .slice(1)
    .filter(Boolean)
    .map(path => {
      return path!
        .replace(/\/+/, '/')
        .split('/')
        .filter(Boolean)
        .join('/')
    })
    .join('/')

  return pathes[0]! + (pathes[0]?.endsWith('/') ? '' : '/') + rest
}

class MaxiosConfigManager<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  static source = axios.CancelToken.source()
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
        : typeof getGlobalConfig()[name] === 'function'
          ? getGlobalConfig()[name]
          : defaultCallback

    return res!
  }

  getNearestCacheConfig () {
    return this.apiConfig.cache ||
      this.moduleConfig.cache ||
      getGlobalConfig().cache
  }

  getAxiosConfig () {
    const axiosConfig: AxiosRequestConfig = {
      ...getGlobalConfig().axiosConfig,
      ...this.moduleConfig.axiosConfig,
      ...this.apiConfig.axiosConfig,
      baseURL: pathJoin(
        getGlobalConfig().axiosConfig?.baseURL,
        this.moduleConfig.axiosConfig?.baseURL,
        this.apiConfig.axiosConfig?.baseURL
      ),
      headers: {
        ...getGlobalConfig().axiosConfig?.headers,
        ...this.moduleConfig.axiosConfig?.headers,
        ...this.apiConfig.axiosConfig?.headers
      },
      params: {
        ...getGlobalConfig().axiosConfig?.params,
        ...this.moduleConfig.axiosConfig?.params,
        ...this.apiConfig.axiosConfig?.params
      }
    }

    // data could be string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams
    const dataList = [
      this.apiConfig.axiosConfig?.data,
      this.moduleConfig.axiosConfig?.data,
      getGlobalConfig().axiosConfig?.data
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
      getGlobalConfig().cancelable !== false &&
      this.moduleConfig.cancelable !== false &&
      this.apiConfig.cancelable !== false
    ) {
      axiosConfig.cancelToken = MaxiosConfigManager.source.token
    }

    return axiosConfig
  }
}

const daches: Record<TCacheType, Dache> = {
  memory: new Dache('memory', 'maxios'),
  session: new Dache('session', 'maxios'),
  local: new Dache('local', 'maxios')
}

class Maxios<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> {
  #configManager: MaxiosConfigManager<Payload, OriginResult, FinalResult>
  #processorManager = new MaxiosProcessorManager<Payload, OriginResult, FinalResult>()

  constructor (config: IMaxiosConstructorConfig<Payload, OriginResult, FinalResult>) {
    // save config
    this.#configManager = new MaxiosConfigManager<Payload, OriginResult, FinalResult>(config)

    // load processors
    this.#processorManager.loadProcessorFromMaxiosConfig(getGlobalConfig())
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
          this.#processorManager.executeAnywayProcessors()
          nextTick(() => {
            this.#processorManager.executeSuccessProcessors(daches[cacheConfig.type].get(cacheConfig.key))
          })
        })
      })
    } else {
      // send request
      request<OriginResult, AxiosResponse<OriginResult, Payload>, Payload>(axiosConfig)
        .then(res => {
          this.#processorManager.executeLoadingProcessors()
          nextTick(() => {
            this.#processorManager.executeAnywayProcessors()
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
            })
          })
        })
        .catch(err => {
          this.#processorManager.executeLoadingProcessors()
          if (axios.isCancel(err)) return
          nextTick(() => {
            this.#processorManager.executeRequestErrorProcessors(err)
          })
        })
    }

    return this.#processorManager.chain()
  }

  static cancelActiveRequests () {
    MaxiosConfigManager.source.cancel()
  }
}
