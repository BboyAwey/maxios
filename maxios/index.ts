import ConfigManager from './config-manager'
import { IMaxiosConfig, IProcessorsChain } from './interfaces'
import { Maxios } from './maxios'
import ProcessorManager from './process-manager'

export const global = <OriginResult = any> (
  config: IMaxiosConfig<unknown, OriginResult> | (() => IMaxiosConfig<unknown, OriginResult>)
) => {
  ConfigManager.globalConfig = config
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

export const race = <Result = any>(
  processChains: IProcessorsChain<any, any, any>[]
) => {
  const pm = new ProcessorManager<any, any, Result>()
  let isSuccessfull = false
  let count = processChains.length

  processChains.forEach(ps => {
    ps.success(res => {
      if (!isSuccessfull) {
        pm.executeSuccessProcessors(res as Result)
        isSuccessfull = true 
      }
    })

    ps.anyway(() => {
      count -= 1
      if (!count) {
        pm.executeAnywayProcessors()
        pm.executeLoadingProcessors()
      }
    })

    ps.bizError((err) => {
      pm.executeBizErrorProcessors(err)
    })
    ps.error((err) => {
      pm.executeRequestErrorProcessors(err)
    })
  })

  return pm.chain()
}

export const all = <Result = any[]>(
  processChains: IProcessorsChain<any, any, any>[]
) => {
  const pm = new ProcessorManager<any, any, Result>()
  let successfullCount = processChains.length
  let anywayCount = processChains.length
  const result = [] as any[]

  processChains.forEach((ps, i) => {
    ps.success(res => {
      successfullCount -= 1
      result[i] = res
      if (!successfullCount) {
        pm.executeSuccessProcessors(result as Result)
      }
    })

    ps.anyway(() => {
      anywayCount -= 1
      if (!anywayCount) {
        pm.executeAnywayProcessors()
        pm.executeLoadingProcessors()
      }
    })

    ps.bizError((err) => {
      pm.executeBizErrorProcessors(err)
    })
    ps.error((err) => {
      pm.executeRequestErrorProcessors(err)
    })
  })

  return pm.chain()
}
