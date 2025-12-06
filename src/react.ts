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
// 如果第一个参数可选，则 request 的参数也应该是可选的
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
      debounce?: boolean | number  // 默认为 false，true 时默认 300ms，number 时为指定毫秒数
    }

// UseMaxios 返回类型
type UseMaxiosReturn<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>,
  TChain extends IProcessorsChain<any, any, any> = ExtractRequestReturn<TRequestFn>
> = {
  // data
  data: ExtractFinalResult<TChain> | undefined
  // loading
  loading: boolean
  // request 函数 - 根据 requestFn 的参数是否必填来决定 request 的参数是否必填
  request: HasParams<TRequestFn> extends true
    ? IsFirstParamRequired<TRequestFn> extends true
      ? (...args: ExtractRequestArgs<TRequestFn>) => IProcessorsChain<any, any, any>
      : (...args: RequestFnArgs<TRequestFn>) => IProcessorsChain<any, any, any>
    : () => IProcessorsChain<any, any, any>
  // error
  error: ExtractOriginResult<TChain> | AxiosError<ExtractOriginResult<TChain>, ExtractPayload<TChain>> | undefined
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
  // 从 options 中提取 args 和 auto
  const initialArgs = options?.args
  const auto = options?.auto ?? true // 默认值为 true
  type Chain = ExtractRequestReturn<TRequestFn>
  type FinalResult = ExtractFinalResult<Chain>
  type OriginResult = ExtractOriginResult<Chain>
  type Payload = ExtractPayload<Chain>
  type Args = ExtractRequestArgs<TRequestFn>

  const [data, setData] = useState<FinalResult | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<OriginResult | AxiosError<OriginResult, Payload> | undefined>(undefined)
  
  const chainRef = useRef<IProcessorsChain<any, any, any> | null>(null)
  const initialArgsRef = useRef<Args | undefined>(initialArgs)
  const requestFnRef = useRef<TRequestFn>(requestFn)

  // 更新初始参数引用
  useEffect(() => {
    initialArgsRef.current = initialArgs
  }, [initialArgs])

  // 更新请求函数引用
  useEffect(() => {
    requestFnRef.current = requestFn
  }, [requestFn])

  // 清理函数：组件卸载时 abort 请求
  useEffect(() => {
    return () => {
      if (chainRef.current) {
        chainRef.current.abort()
      }
    }
  }, [])

  // 创建请求函数
  const request = useCallback((...newArgs: any[]): IProcessorsChain<any, any, any> => {
    // 重置错误状态
    setError(undefined)

    // 获取最新的请求函数引用
    const currentRequestFn = requestFnRef.current
    
    // 调用请求函数
    // 使用类型断言来处理不同的函数签名
    let chain: IProcessorsChain<any, any, any>
    if (currentRequestFn.length === 0) {
      // 无参数的请求方法
      chain = (currentRequestFn as () => IProcessorsChain<any, any, any>)()
    } else {
      // 有参数的请求方法
      // 确定使用的参数：优先使用新参数，否则使用初始参数
      const args = newArgs.length > 0 ? newArgs : initialArgsRef.current
      
      if (args !== undefined && args.length > 0) {
        // 提供了参数，使用展开运算符调用
        chain = (currentRequestFn as (...args: any[]) => IProcessorsChain<any, any, any>)(...args)
      } else {
        // 没有提供参数，但函数需要参数
        // 对于可选参数函数，应该允许调用而不传参数
        // 尝试调用函数，如果参数是可选的，调用会成功；如果是必填的，函数内部可能会报错
        // 这里我们尝试调用，让函数自己决定是否接受无参数调用
        try {
          chain = (currentRequestFn as (...args: any[]) => IProcessorsChain<any, any, any>)()
        } catch (err) {
          // 如果调用失败，说明参数是必填的
          throw new Error('Request function requires parameters but none were provided')
        }
      }
    }

    // 保存 chain 引用以便后续 abort
    chainRef.current = chain

    // 设置 loading 状态
    chain.loading((status: boolean) => {
      setLoading(status)
    })

    // 处理成功响应
    chain.success((responseData: FinalResult) => {
      setData(responseData)
      setError(undefined)
    })

    // 处理请求错误
    chain.requestError((err: AxiosError<OriginResult, Payload>) => {
      setError(err)
      setData(undefined)
    })

    // 处理业务错误
    chain.error((errorData: OriginResult) => {
      setError(errorData)
      setData(undefined)
    })

    return chain
  }, [])

  // 使用 useRef 来跟踪上一次的 args 值，使用深度比较避免无限循环
  const prevArgsRef = useRef<Args | undefined>()
  
  // 稳定 auto 的引用
  const autoRef = useRef(auto)
  useEffect(() => {
    autoRef.current = auto
  }, [auto])
  
  // 使用 useRef 存储 condition 函数（防御性编程）
  const conditionRef = useRef<(() => boolean) | undefined>()
  useEffect(() => {
    if (typeof auto === 'object' && auto.condition) {
      conditionRef.current = auto.condition
    } else {
      conditionRef.current = undefined
    }
  }, [auto])
  
  // 解析 debounce 参数
  const getDebounceDelay = (): number | null => {
    if (typeof auto === 'object' && auto.debounce !== undefined) {
      if (auto.debounce === true) {
        return 300 // 默认 300ms
      } else if (typeof auto.debounce === 'number') {
        return auto.debounce
      }
    }
    return null // 不防抖
  }
  
  const debounceDelay = getDebounceDelay()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [])
  
  // 如果 auto 是函数，需要跟踪其返回值的变化
  const autoValue = typeof auto === 'function' ? auto() : typeof auto === 'object' ? auto.enable : auto
  const prevAutoValueRef = useRef<boolean | undefined>()
  
  // 触发请求的函数（可能被防抖包装）
  const triggerRequest = useCallback(() => {
    if (requestFn.length === 0) {
      // 无参数函数：直接调用
      request()
    } else {
      // 有参数函数
      if (initialArgs !== undefined && initialArgs.length > 0) {
        // 有 args：使用 args
        request(...initialArgs)
      } else {
        // 没有 args：对于可选参数函数，应该允许调用而不传参数
        // request 函数内部会处理这种情况
        request()
      }
    }
  }, [requestFn, initialArgs, request])
  
  // 自动触发请求逻辑
  useEffect(() => {
    // 使用深度比较检查 args 是否真的变化了
    const argsChanged = !isEqual(initialArgs, prevArgsRef.current)
    
    // 检查 auto 值是否变化了（只对非函数类型有效）
    const autoChanged = typeof auto !== 'function' && typeof auto !== 'object' && autoValue !== prevAutoValueRef.current
    
    // 如果 args 和 auto 都没有变化，不触发请求
    if (!argsChanged && !autoChanged && prevArgsRef.current !== undefined) {
      return
    }
    
    // 更新上一次的值
    prevArgsRef.current = initialArgs
    if (typeof auto !== 'function' && typeof auto !== 'object') {
      prevAutoValueRef.current = autoValue
    }
    
    // 解析 shouldAuto
    let shouldAuto = true
    const currentAuto = autoRef.current
    if (typeof currentAuto === 'object') {
      // enable 默认为 true（如果未提供）
      shouldAuto = currentAuto.enable ?? true
      if (shouldAuto && conditionRef.current) {
        shouldAuto = conditionRef.current() // 调用最新的 condition
      }
    } else if (typeof currentAuto === 'function') {
      shouldAuto = currentAuto()
    } else {
      shouldAuto = currentAuto ?? true
    }
    
    if (!shouldAuto) {
      return
    }
    
    // 处理防抖：仅在 args 变化时防抖
    if (debounceDelay !== null && argsChanged) {
      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      // 设置新的定时器
      debounceTimerRef.current = setTimeout(() => {
        triggerRequest()
        debounceTimerRef.current = null
      }, debounceDelay)
    } else {
      // 不防抖或非 args 变化，直接触发
      triggerRequest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArgs, autoValue, debounceDelay, triggerRequest])
  // 关键：使用深度比较来检查 args 是否真的变化，避免引用变化导致的无限循环

  return {
    data,
    loading,
    request: request as any,
    error
  } as UseMaxiosReturn<TRequestFn>
}
