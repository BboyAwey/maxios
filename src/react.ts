import { useEffect, useRef, useState } from 'react'
import { AxiosError } from 'axios'
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

// 类型工具：从请求函数中提取参数类型
type ExtractRequestParams<T> = T extends (params: infer Param) => any
  ? Param
  : T extends () => any
  ? never
  : never

// 类型工具：从请求函数中提取返回类型（IProcessorsChain）
type ExtractRequestReturn<T> = T extends (...args: any[]) => infer R
  ? R extends IProcessorsChain<any, any, any>
    ? R
    : never
  : never

// 判断请求函数是否接受参数
type HasParams<T> = T extends (...args: [any, ...any[]]) => any ? true : false

// UseMaxios 返回类型
type UseMaxiosReturn<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>,
  TChain extends IProcessorsChain<any, any, any> = ExtractRequestReturn<TRequestFn>
> = [
  // request 函数
  HasParams<TRequestFn> extends true
    ? (params?: ExtractRequestParams<TRequestFn>) => IProcessorsChain<any, any, any>
    : () => IProcessorsChain<any, any, any>,
  // result
  ExtractFinalResult<TChain> | undefined,
  // loading
  boolean,
  // error
  ExtractOriginResult<TChain> | AxiosError<ExtractOriginResult<TChain>, ExtractPayload<TChain>> | undefined
]

// useMaxios 函数重载：无参数的请求方法
export function useMaxios<
  TRequestFn extends () => IProcessorsChain<any, any, any>
>(requestFn: TRequestFn): UseMaxiosReturn<TRequestFn>

// useMaxios 函数重载：有参数的请求方法，不带初始参数
export function useMaxios<
  TRequestFn extends (params: any) => IProcessorsChain<any, any, any>
>(requestFn: TRequestFn): UseMaxiosReturn<TRequestFn>

// useMaxios 函数重载：有参数的请求方法，带初始参数
export function useMaxios<
  TRequestFn extends (params: any) => IProcessorsChain<any, any, any>,
  TParams extends ExtractRequestParams<TRequestFn>
>(requestFn: TRequestFn, initialParams: TParams): UseMaxiosReturn<TRequestFn>

// useMaxios 实现
export function useMaxios<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  initialParams?: ExtractRequestParams<TRequestFn>
): UseMaxiosReturn<TRequestFn> {
  type Chain = ExtractRequestReturn<TRequestFn>
  type FinalResult = ExtractFinalResult<Chain>
  type OriginResult = ExtractOriginResult<Chain>
  type Payload = ExtractPayload<Chain>
  type Params = ExtractRequestParams<TRequestFn>

  const [result, setResult] = useState<FinalResult | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<OriginResult | AxiosError<OriginResult, Payload> | undefined>(undefined)
  
  const chainRef = useRef<IProcessorsChain<any, any, any> | null>(null)
  const initialParamsRef = useRef<Params | undefined>(initialParams)

  // 更新初始参数引用
  useEffect(() => {
    initialParamsRef.current = initialParams
  }, [initialParams])

  // 清理函数：组件卸载时 abort 请求
  useEffect(() => {
    return () => {
      if (chainRef.current) {
        chainRef.current.abort()
      }
    }
  }, [])

  // 创建请求函数
  const request = (newParams?: Params): IProcessorsChain<any, any, any> => {
    // 重置状态
    setError(undefined)
    setResult(undefined)

    // 确定使用的参数：优先使用新参数，否则使用初始参数
    const params = newParams !== undefined ? newParams : initialParamsRef.current
    
    // 调用请求函数
    // 使用类型断言来处理不同的函数签名
    let chain: IProcessorsChain<any, any, any>
    if (requestFn.length === 0) {
      // 无参数的请求方法
      chain = (requestFn as () => IProcessorsChain<any, any, any>)()
    } else if (params !== undefined) {
      // 有参数的请求方法，且提供了参数
      chain = (requestFn as (params: Params) => IProcessorsChain<any, any, any>)(params)
    } else {
      // 有参数的请求方法，但没有提供参数（这种情况在类型层面不应该发生，但为了运行时安全）
      // 如果既没有新参数也没有初始参数，抛出错误
      throw new Error('Request function requires parameters but none were provided')
    }

    // 保存 chain 引用以便后续 abort
    chainRef.current = chain

    // 设置 loading 状态
    chain.loading((status: boolean) => {
      setLoading(status)
    })

    // 处理成功响应
    chain.success((data: FinalResult) => {
      setResult(data)
      setError(undefined)
    })

    // 处理请求错误
    chain.requestError((err: AxiosError<OriginResult, Payload>) => {
      setError(err)
      setResult(undefined)
    })

    // 处理业务错误
    chain.error((data: OriginResult) => {
      setError(data)
      setResult(undefined)
    })

    return chain
  }

  return [request as any, result, loading, error] as UseMaxiosReturn<TRequestFn>
}
