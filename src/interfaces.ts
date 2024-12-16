import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { TCacheType } from '@awey/dache'

export type TLoading = (status: boolean) => void | boolean
export type TRequestError<Payload, Result> = (error: AxiosError<Result, Payload>) => void | boolean
export type TError<Result> = (data: Result) => void | boolean
export type TSuccess<Result> = (data: Result) => void | boolean
export type TAnyway = (result?: AxiosResponse | AxiosError, config?: AxiosRequestConfig) => void | boolean

export type TProcessorNames = Partial<Record<
  'loading' | 'error' | 'bizError' | 'success' | 'anyway',
  any
>>
export interface IProcessorsChain<Payload, OriginResult, FinalResult> extends TProcessorNames {
  loading: (fn: TLoading) => IProcessorsChain<Payload, OriginResult, FinalResult>
  success: (fn: TSuccess<FinalResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  requestError: (fn: TRequestError<Payload, OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  error: (fn: TError<OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  anyway: (fn: TAnyway) => IProcessorsChain<Payload, OriginResult, FinalResult>
  abort: () => IProcessorsChain<Payload, OriginResult, FinalResult>
}

export type TExpect<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => boolean

export type TExtractor<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => unknown

export type TRequest = <T = unknown, R = AxiosResponse<T>, D = any> (config: AxiosRequestConfig<D>) => Promise<R>

export type TNearestCallbackName = 'extractor' | 'expect' | 'request'

export interface IRetryWhen<T> {
  beforeRetry?: () => Promise<any> | boolean | void
  condition?: (res: T) => boolean
  retryOthers?: boolean | 'module' | 'global'
  maximumCount?: number
}

export interface IMaxiosInnerConfig<
  Payload = any,
  OriginResult = any,
  FinalResult = OriginResult
> extends TProcessorNames, Partial<Record<TNearestCallbackName, any>> {
  axiosConfig?: AxiosRequestConfig<Payload>
  expect?: TExpect<Payload, OriginResult>
  extractor?: TExtractor<Payload, OriginResult>
  request?: TRequest
  cache?: {
    type: TCacheType
    key: string
  }
  retryWhen?: {
    requestSuccess?: IRetryWhen<AxiosResponse<OriginResult, Payload>>
    requestError?: IRetryWhen<AxiosError<OriginResult, Payload>>
  }
  // processors 
  loading?: TLoading
  requestError?: TRequestError<Payload, OriginResult>
  error?: TError<OriginResult>
  success?: TSuccess<FinalResult>
  anyway?: TAnyway
}

export type TMaxiosConfig<
Payload = any,
OriginResult = any,
FinalResult = OriginResult
> = Omit<IMaxiosInnerConfig<Payload, OriginResult, FinalResult>, 'axiosConfig'>

export type TAxiosConfig<Payload> = IMaxiosInnerConfig<Payload>['axiosConfig']
