import ConfigManager from './config-manager'
import { IMaxiosConfig, IProcessorsChain } from './interfaces'
import { Maxios } from './maxios'

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