import ConfigManager from './config-manager'
import { IProcessorsChain, TAxiosConfig, TMaxiosConfig } from './interfaces'
import { Maxios } from './maxios'
import ProcessorManager from './process-manager'

const getExactConfig = <T> (config: T | (() => T)) => {
  return config instanceof Function? config() : config
}

export const globalConfig = <OriginResult = any> (
  globalAxiosConfig?: TAxiosConfig<unknown> | (() => TAxiosConfig<unknown>),
  globalMaxiosConfig?: TMaxiosConfig<unknown, OriginResult> | (() => TMaxiosConfig<unknown, OriginResult>)
) => {
  ConfigManager.globalConfig = () => ({
    axiosConfig: getExactConfig(globalAxiosConfig),
    ...getExactConfig(globalMaxiosConfig)
  })
}

export const modulize = <OriginResult = any> (
  moduleAxiosConfig?: TAxiosConfig<unknown> | (() => TAxiosConfig<unknown>),
  moduleMaxiosConfig?: TMaxiosConfig<unknown, OriginResult> | (() => TMaxiosConfig<unknown, OriginResult>)
): (
  <Payload = any, OriginResult = any, FinalResult = OriginResult> (
    axiosConfig?: TAxiosConfig<Payload> | (() => TAxiosConfig<Payload>),
    maxiosConfig?: TMaxiosConfig<Payload, OriginResult, FinalResult> | (() => TMaxiosConfig<Payload, OriginResult, FinalResult>)
  ) => IProcessorsChain<Payload, OriginResult, FinalResult>
) => {
  return (apiAxiosConfig, apiMaxiosConfig) => {
    return new Maxios({
      moduleConfig: () => ({
        axiosConfig: getExactConfig(moduleAxiosConfig),
        ...getExactConfig(moduleMaxiosConfig)
      }),
      apiConfig: () => ({
        axiosConfig: getExactConfig(apiAxiosConfig),
        ...getExactConfig(apiMaxiosConfig)
      })
    }).request()
  }
}

export const race = <Result = any>(
  requests: IProcessorsChain<any, any, any>[]
) => {
  const pm = new ProcessorManager<any, any, Result>()
  let isSuccessfull = false
  let count = requests.length

  requests.forEach(req => {
    req.success(res => {
      if (!isSuccessfull) {
        pm.executeSuccessProcessors(res as Result)
        isSuccessfull = true 
      }
    })

    req.anyway((res, config) => {
      count -= 1
      if (!count) {
        pm.executeLoadingProcessors()
        pm.executeAnywayProcessors(res, config)
      }
    })

    req.error((err) => {
      pm.executeErrorProcessors(err)
    })
    req.statusError((err) => {
      pm.executeStatusErrorProcessors(err)
    })
  })

  return pm.chain()
}

export const all = <Result = any[]>(
  requests: IProcessorsChain<any, any, any>[]
) => {
  const pm = new ProcessorManager<any, any, Result>()
  let successfullCount = requests.length
  let anywayCount = requests.length
  const result = [] as any[]

  requests.forEach((req, i) => {
    req.success(res => {
      successfullCount -= 1
      result[i] = res
      if (!successfullCount) {
        pm.executeSuccessProcessors(result as Result)
      }
    })

    req.anyway((res, config) => {
      anywayCount -= 1
      if (!anywayCount) {
        pm.executeLoadingProcessors()
        pm.executeAnywayProcessors(res, config)
      }
    })

    req.error((err) => {
      pm.executeErrorProcessors(err)
    })
    req.statusError((err) => {
      pm.executeStatusErrorProcessors(err)
    })
  })

  return pm.chain()
}

export const toPromise = <Payload = any, OriginResult = any, FinalResult = OriginResult>(
  request: IProcessorsChain<Payload, OriginResult, FinalResult>
) => {
  return new Promise<FinalResult>((resolve, reject) => {
    request
      .success(res => resolve(res))
      .statusError(error => {
        reject(new Error(error.message, error.cause))
        return true
      })
      .error(res => {
        reject(new Error(JSON.stringify(res)))
        return true
      })
  })
}
