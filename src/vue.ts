import { ref, onUnmounted, onMounted, watch, type Ref } from 'vue'
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
  : T extends (params?: infer Param) => any
  ? Param
  : T extends () => any
  ? never
  : never

// 类型工具：判断请求函数的参数是否可选
type IsParamsOptional<T> = T extends (params?: any) => any
  ? true
  : T extends (params: any) => any
  ? false
  : false

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
> = {
  // data
  data: Ref<ExtractFinalResult<TChain> | undefined>
  // loading
  loading: Ref<boolean>
  // request 函数 - 根据 requestFn 的参数是否可选来决定 request 的参数是否可选
  request: HasParams<TRequestFn> extends true
    ? IsParamsOptional<TRequestFn> extends true
      ? (params?: ExtractRequestParams<TRequestFn>) => IProcessorsChain<any, any, any>
      : (params: ExtractRequestParams<TRequestFn>) => IProcessorsChain<any, any, any>
    : () => IProcessorsChain<any, any, any>
  // error
  error: Ref<ExtractOriginResult<TChain> | AxiosError<ExtractOriginResult<TChain>, ExtractPayload<TChain>> | undefined>
}

// useMaxios 函数重载：无参数的请求方法
export function useMaxios<
  TRequestFn extends () => IProcessorsChain<any, any, any>
>(requestFn: TRequestFn, immediate?: boolean): UseMaxiosReturn<TRequestFn>

// useMaxios 函数重载：有参数的请求方法，不带初始参数
export function useMaxios<
  TRequestFn extends (params: any) => IProcessorsChain<any, any, any>
>(requestFn: TRequestFn, immediate?: boolean): UseMaxiosReturn<TRequestFn>

// useMaxios 函数重载：有参数的请求方法，带初始参数
export function useMaxios<
  TRequestFn extends (params: any) => IProcessorsChain<any, any, any>,
  TParams extends ExtractRequestParams<TRequestFn>
>(requestFn: TRequestFn, initialParams: TParams, immediate?: boolean): UseMaxiosReturn<TRequestFn>

// useMaxios 实现
export function useMaxios<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  initialParamsOrImmediate?: ExtractRequestParams<TRequestFn> | boolean,
  immediate?: boolean
): UseMaxiosReturn<TRequestFn> {
  // 处理参数：如果第二个参数是 boolean，说明是 immediate，否则是 initialParams
  const initialParams = typeof initialParamsOrImmediate === 'boolean' ? undefined : initialParamsOrImmediate
  const shouldImmediate = typeof initialParamsOrImmediate === 'boolean' ? initialParamsOrImmediate : (immediate ?? false)
  type Chain = ExtractRequestReturn<TRequestFn>
  type FinalResult = ExtractFinalResult<Chain>
  type OriginResult = ExtractOriginResult<Chain>
  type Payload = ExtractPayload<Chain>
  type Params = ExtractRequestParams<TRequestFn>

  const data = ref<FinalResult | undefined>(undefined)
  const loading = ref<boolean>(false)
  const error = ref<OriginResult | AxiosError<OriginResult, Payload> | undefined>(undefined)
  
  const chainRef = ref<IProcessorsChain<any, any, any> | null>(null)
  const initialParamsRef = ref<Params | undefined>(initialParams)
  const requestFnRef = ref<TRequestFn>(requestFn)

  // 创建请求函数
  const request = (newParams?: Params): IProcessorsChain<any, any, any> => {
    // 重置错误状态
    error.value = undefined

    // 确定使用的参数：优先使用新参数，否则使用初始参数
    const params = newParams !== undefined ? newParams : initialParamsRef.value
    
    // 获取最新的请求函数引用
    const currentRequestFn = requestFnRef.value
    
    // 调用请求函数
    // 使用类型断言来处理不同的函数签名
    let chain: IProcessorsChain<any, any, any>
    if (currentRequestFn.length === 0) {
      // 无参数的请求方法
      chain = (currentRequestFn as () => IProcessorsChain<any, any, any>)()
    } else if (params !== undefined) {
      // 有参数的请求方法，且提供了参数
      chain = (currentRequestFn as (params: Params) => IProcessorsChain<any, any, any>)(params)
    } else {
      // 有参数的请求方法，但没有提供参数（这种情况在类型层面不应该发生，但为了运行时安全）
      // 如果既没有新参数也没有初始参数，抛出错误
      throw new Error('Request function requires parameters but none were provided')
    }

    // 保存 chain 引用以便后续 abort
    chainRef.value = chain

    // 设置 loading 状态
    chain.loading((status: boolean) => {
      loading.value = status
    })

    // 处理成功响应
    chain.success((responseData: FinalResult) => {
      data.value = responseData
      error.value = undefined
    })

    // 处理请求错误
    chain.requestError((err: AxiosError<OriginResult, Payload>) => {
      error.value = err
      data.value = undefined
    })

    // 处理业务错误
    chain.error((errorData: OriginResult) => {
      error.value = errorData
      data.value = undefined
    })

    return chain
  }

  // 更新请求函数引用（当 requestFn 变化时）
  watch(() => requestFn, (newRequestFn: TRequestFn) => {
    requestFnRef.value = newRequestFn
  }, { immediate: true })

  // 更新初始参数引用（当 initialParams 变化时）
  watch(() => initialParams, (newParams: Params | undefined) => {
    initialParamsRef.value = newParams
  }, { immediate: true })

  // 清理函数：组件卸载时 abort 请求
  onUnmounted(() => {
    if (chainRef.value) {
      chainRef.value.abort()
    }
  })

  // 立即发起请求（如果 immediate 为 true）
  onMounted(() => {
    if (shouldImmediate) {
      // 无参数请求函数：直接调用
      if (requestFn.length === 0) {
        request()
      } 
      // 有参数请求函数：必须有 initialParams 才调用
      else if (initialParams !== undefined) {
        request()
      }
    }
  })

  return {
    data,
    loading,
    request: request as any,
    error
  } as UseMaxiosReturn<TRequestFn>
}

