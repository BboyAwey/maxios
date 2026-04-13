import { useCallback, useEffect, useRef, useState } from 'react'
import { AxiosError } from 'axios'
import isEqual from 'fast-deep-equal'
import { IProcessorsChain } from './interfaces'

// 类型工具：从 IProcessorsChain 中提取 FinalResult
type ExtractFinalResult<T> = T extends IProcessorsChain<any, any, infer FinalResult>
  ? FinalResult
  : never

// 类型工具：从 IProcessorsChain 中提取 OriginResult
type ExtractOriginResult<T> = T extends IProcessorsChain<any, infer OriginResult, any>
  ? OriginResult
  : never

// 类型工具：从 IProcessorsChain 中提取 Payload
type ExtractPayload<T> = T extends IProcessorsChain<infer Payload, any, any>
  ? Payload
  : never

// 类型工具：从请求函数中提取所有参数作为元组
type ExtractRequestArgs<T> = T extends (...args: infer Args) => any ? Args : never

// 类型工具：判断请求函数是否接受参数
type HasParams<T> = T extends (...args: [any, ...any[]]) => any ? true : false

// 类型工具：判断第一个参数是否必填
type IsFirstParamRequired<T> = T extends (...args: infer Args) => any
  ? Args extends [infer First, ...any[]]
    ? First extends undefined
      ? false
      : T extends (first?: any, ...rest: any[]) => any
        ? false
        : true
    : false
  : false

// 类型工具：根据函数签名创建 request 函数的参数类型
type RequestFnArgs<T> = T extends (...args: infer Args) => any
  ? T extends (first?: any, ...rest: any[]) => any
    ? Args extends [infer First, ...infer Rest]
      ? [first?: First, ...rest: Rest]
      : Args
    : Args
  : never

// 类型工具：从请求函数中提取返回类型（IProcessorsChain）
type ExtractRequestReturn<T> = T extends (...args: any[]) => infer R
  ? R extends IProcessorsChain<any, any, any>
    ? R
    : never
  : never

// AutoOption 类型定义
type AutoOption =
  | boolean
  | (() => boolean)
  | {
      enable?: boolean
      condition?: () => boolean
      debounce?: boolean | number
    }

// UseMaxios 返回类型
type UseMaxiosReturn<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>,
  TChain extends IProcessorsChain<any, any, any> = ExtractRequestReturn<TRequestFn>
> = {
  data: ExtractFinalResult<TChain> | undefined
  loading: boolean
  request: HasParams<TRequestFn> extends true
    ? IsFirstParamRequired<TRequestFn> extends true
      ? (...args: ExtractRequestArgs<TRequestFn>) => IProcessorsChain<any, any, any>
      : (...args: RequestFnArgs<TRequestFn>) => IProcessorsChain<any, any, any>
    : () => IProcessorsChain<any, any, any>
  error: ExtractOriginResult<TChain> | AxiosError<ExtractOriginResult<TChain>, ExtractPayload<TChain>> | undefined
}

// 自定义 hook：用深比较稳定引用，避免 args 每次渲染产生新引用导致无限循环
function useDeepCompareRef<T>(value: T): T {
  const ref = useRef<T>(value)
  if (!isEqual(ref.current, value)) {
    ref.current = value
  }
  return ref.current
}

// 解析 auto 配置，返回是否应该自动触发
function resolveAutoOption(auto: AutoOption): boolean {
  if (typeof auto === 'function') return auto()
  if (typeof auto === 'object') {
    const enabled = auto.enable ?? true
    if (!enabled) return false
    return auto.condition ? auto.condition() : true
  }
  return auto ?? true
}

// 解析 debounce 延迟
function resolveDebounceDelay(auto: AutoOption): number | null {
  if (typeof auto === 'object' && auto.debounce !== undefined) {
    if (auto.debounce === true) return 300
    if (typeof auto.debounce === 'number') return auto.debounce
  }
  return null
}

// useMaxios 函数重载：无参数的请求方法
export function useMaxios<
  TRequestFn extends () => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  options?: { auto?: AutoOption }
): UseMaxiosReturn<TRequestFn>

// useMaxios 函数重载：有参数的请求方法
export function useMaxios<
  TRequestFn extends (...args: [any, ...any[]]) => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  options?: { args?: ExtractRequestArgs<TRequestFn>, auto?: AutoOption }
): UseMaxiosReturn<TRequestFn>

// useMaxios 实现
export function useMaxios<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  options?: { args?: ExtractRequestArgs<TRequestFn>, auto?: AutoOption }
): UseMaxiosReturn<TRequestFn> {
  const auto = options?.auto ?? true
  const debounceDelay = resolveDebounceDelay(auto)

  type Chain = ExtractRequestReturn<TRequestFn>
  type FinalResult = ExtractFinalResult<Chain>
  type OriginResult = ExtractOriginResult<Chain>
  type Payload = ExtractPayload<Chain>

  const [data, setData] = useState<FinalResult | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<OriginResult | AxiosError<OriginResult, Payload> | undefined>(undefined)

  // 用深比较稳定 args 引用
  const stableArgs = useDeepCompareRef(options?.args)

  const chainRef = useRef<IProcessorsChain<any, any, any> | null>(null)
  const requestFnRef = useRef(requestFn)
  const argsRef = useRef(stableArgs)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 始终保持最新引用
  requestFnRef.current = requestFn
  argsRef.current = stableArgs

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      chainRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  // 核心请求函数
  const request = useCallback((...newArgs: any[]): IProcessorsChain<any, any, any> => {
    setError(undefined)

    const fn = requestFnRef.current
    let chain: IProcessorsChain<any, any, any>

    if (fn.length === 0) {
      chain = (fn as () => IProcessorsChain<any, any, any>)()
    } else {
      const args = newArgs.length > 0 ? newArgs : argsRef.current
      if (args !== undefined && args.length > 0) {
        chain = (fn as (...a: any[]) => IProcessorsChain<any, any, any>)(...args)
      } else {
        chain = (fn as (...a: any[]) => IProcessorsChain<any, any, any>)()
      }
    }

    chainRef.current = chain

    chain.loading((status: boolean) => { setLoading(status) })
    chain.success((res: FinalResult) => { setData(res); setError(undefined) })
    chain.requestError((err: AxiosError<OriginResult, Payload>) => { setError(err); setData(undefined) })
    chain.error((err: OriginResult) => { setError(err); setData(undefined) })

    return chain
  }, [])

  // 触发请求（带可选防抖）
  const triggerRequest = useCallback(() => {
    const fn = requestFnRef.current
    const args = argsRef.current
    if (fn.length === 0) {
      request()
    } else if (args !== undefined && args.length > 0) {
      request(...args)
    } else {
      request()
    }
  }, [request])

  // 自动触发逻辑：仅依赖 stableArgs（深比较后的稳定引用）
  useEffect(() => {
    if (!resolveAutoOption(auto)) return

    if (debounceDelay !== null) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        triggerRequest()
        debounceTimerRef.current = null
      }, debounceDelay)
    } else {
      triggerRequest()
    }
  }, [stableArgs, auto, debounceDelay, triggerRequest])

  return {
    data,
    loading,
    request: request as any,
    error
  } as UseMaxiosReturn<TRequestFn>
}
