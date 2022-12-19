import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { TCacheType } from '@awey/dache'

export type TLoading = (status: boolean) => void
export type TRequestError<Payload, Result> = (error: AxiosError<Result, Payload>) => void | boolean
export type TBizError<Result> = (data: Result) => void | boolean
export type TSuccess<Result> = (data: Result) => void
export type TAnyway = () => void

export interface IProcessors<Payload, OriginResult, FinalResult> {
  loading?: TLoading
  error?: TRequestError<Payload, OriginResult>
  bizError?: TBizError<OriginResult>
  success?: TSuccess<FinalResult>
  anyway?: TAnyway
}

export interface IProcessorsChain<Payload, OriginResult, FinalResult> {
  loading: (arg: TLoading) => IProcessorsChain<Payload, OriginResult, FinalResult>
  success: (fn: TSuccess<FinalResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  error: (fn: TRequestError<Payload, OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  bizError: (fn: TBizError<OriginResult>) => IProcessorsChain<Payload, OriginResult, FinalResult>
  anyway: (fn: TAnyway) => IProcessorsChain<Payload, OriginResult, FinalResult>
}

export type TIndicator<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => boolean

export type TExtractor<Payload = any, OriginResult = any> = (response: AxiosResponse<OriginResult, Payload>) => unknown

export type TRequest = <T = unknown, R = AxiosResponse<T>, D = any> (config: AxiosRequestConfig<D>) => Promise<R>

export type TNearestCallbackName = 'extractor' | 'indicator' | 'request'

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