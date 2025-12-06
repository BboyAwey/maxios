import { ref, onUnmounted, onMounted, watch, type Ref, type ComputedRef } from 'vue'
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

// 类型工具：从请求函数中提取所有参数作为元组
type ExtractRequestArgs<T> = T extends (...args: infer Args) => any ? Args : never

// 类型工具：提取元组的所有元素类型作为联合类型，然后创建数组类型
type TupleToElementArray<T> = T extends readonly [...infer U]
  ? U[number][]
  : T extends readonly (infer U)[]
  ? U[]
  : T

// 类型工具：支持 Ref 或 ComputedRef 作为 args
// 允许数组类型以支持 computed(() => [value]) 的情况
// 当 T 是元组时，也接受对应元素类型的数组
type ArgsOption<T> = 
  | T 
  | Ref<T> 
  | ComputedRef<T> 
  | Ref<TupleToElementArray<T>> 
  | ComputedRef<TupleToElementArray<T>>

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
  data: Ref<ExtractFinalResult<TChain> | undefined>
  // loading
  loading: Ref<boolean>
  // request 函数 - 根据 requestFn 的参数是否必填来决定 request 的参数是否必填
  request: HasParams<TRequestFn> extends true
    ? IsFirstParamRequired<TRequestFn> extends true
      ? (...args: ExtractRequestArgs<TRequestFn>) => IProcessorsChain<any, any, any>
      : (...args: RequestFnArgs<TRequestFn>) => IProcessorsChain<any, any, any>
    : () => IProcessorsChain<any, any, any>
  // error
  error: Ref<ExtractOriginResult<TChain> | AxiosError<ExtractOriginResult<TChain>, ExtractPayload<TChain>> | undefined>
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
  options?: { args?: ArgsOption<ExtractRequestArgs<TRequestFn>>, auto?: AutoOption }
): UseMaxiosReturn<TRequestFn>

// useMaxios 实现
export function useMaxios<
  TRequestFn extends (...args: any[]) => IProcessorsChain<any, any, any>
>(
  requestFn: TRequestFn,
  options?: { args?: ArgsOption<ExtractRequestArgs<TRequestFn>>, auto?: AutoOption }
): UseMaxiosReturn<TRequestFn> {
  // 从 options 中提取 args 和 auto
  // 支持 computed ref 作为 args（Vue 响应式）
  const initialArgs = options?.args
  const auto = options?.auto ?? true // 默认值为 true
  type Chain = ExtractRequestReturn<TRequestFn>
  type FinalResult = ExtractFinalResult<Chain>
  type OriginResult = ExtractOriginResult<Chain>
  type Payload = ExtractPayload<Chain>
  type Args = ExtractRequestArgs<TRequestFn>

  const data = ref<FinalResult | undefined>(undefined)
  const loading = ref<boolean>(false)
  const error = ref<OriginResult | AxiosError<OriginResult, Payload> | undefined>(undefined)
  
  const chainRef = ref<IProcessorsChain<any, any, any> | null>(null)
  // 如果 initialArgs 是 computed ref，需要获取其值
  const getInitialArgs = () => {
    if (initialArgs && typeof initialArgs === 'object' && 'value' in initialArgs) {
      return (initialArgs as any).value
    }
    return initialArgs
  }
  const initialArgsRef = ref<Args | undefined>(getInitialArgs())
  const requestFnRef = ref<TRequestFn>(requestFn)

  // 创建请求函数
  const request = (...newArgs: any[]): IProcessorsChain<any, any, any> => {
    // 重置错误状态
    error.value = undefined

    // 获取最新的请求函数引用
    const currentRequestFn = requestFnRef.value
    
    // 调用请求函数
    // 使用类型断言来处理不同的函数签名
    let chain: IProcessorsChain<any, any, any>
    if (currentRequestFn.length === 0) {
      // 无参数的请求方法
      chain = (currentRequestFn as () => IProcessorsChain<any, any, any>)()
    } else {
      // 有参数的请求方法
      // 确定使用的参数：优先使用新参数，否则使用初始参数
      const args = newArgs.length > 0 ? newArgs : initialArgsRef.value
      
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

  // 更新初始参数引用（当 initialArgs 变化时）
  // 支持 computed ref 作为 args
  watch(() => {
    if (initialArgs && typeof initialArgs === 'object' && 'value' in initialArgs) {
      return (initialArgs as any).value
    }
    return initialArgs
  }, (newArgs: Args | undefined) => {
    initialArgsRef.value = newArgs
  }, { immediate: true })

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
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  
  // 清理函数：组件卸载时 abort 请求和清理定时器
  onUnmounted(() => {
    if (chainRef.value) {
      chainRef.value.abort()
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  })

  // 自动触发请求逻辑
  // 支持 computed ref 作为 args
  const getArgsValue = () => {
    if (initialArgs && typeof initialArgs === 'object' && 'value' in initialArgs) {
      return (initialArgs as any).value
    }
    return initialArgs
  }
  
  // 检查是否有有效的 args（考虑 computed ref 的情况）
  const hasValidArgs = () => {
    const argsValue = getArgsValue()
    return argsValue !== undefined && Array.isArray(argsValue) && argsValue.length > 0
  }
  
  // 检查初始时是否有有效的 args
  const initialHasValidArgs = hasValidArgs()
  
  // 触发请求的函数（可能被防抖包装）
  const triggerRequest = () => {
    if (requestFn.length === 0) {
      request()
    } else {
      const argsValue = getArgsValue()
      if (argsValue !== undefined && Array.isArray(argsValue) && argsValue.length > 0) {
        request(...argsValue)
      } else {
        // args 是 undefined 或空数组
        // 对于可选参数函数，应该允许调用而不传参数
        // request 函数内部会处理这种情况
        request()
      }
    }
  }
  
  // 计算 shouldAuto
  const computeShouldAuto = (): boolean => {
    if (typeof auto === 'object') {
      const enable = auto.enable ?? true
      if (!enable) {
        return false
      }
      if (auto.condition) {
        return auto.condition()
      }
      return true
    } else if (typeof auto === 'function') {
      return auto()
    }
    return auto ?? true
  }
  
  if (initialArgs !== undefined && initialHasValidArgs) {
    // 有 args：监听 args 变化
    let prevArgs: Args | undefined = undefined
    
    watch(
      [() => getArgsValue(), () => computeShouldAuto()],
      ([newArgs, shouldAuto]) => {
        if (!shouldAuto) {
          return
        }
        
        // 检查 args 是否真的变化了（仅在 args 变化时应用防抖）
        const argsChanged = JSON.stringify(newArgs) !== JSON.stringify(prevArgs)
        prevArgs = newArgs
        
        // 处理防抖：仅在 args 变化时防抖
        if (debounceDelay !== null && argsChanged) {
          // 清除之前的定时器
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }
          // 设置新的定时器
          debounceTimer = setTimeout(() => {
            triggerRequest()
            debounceTimer = null
          }, debounceDelay)
        } else {
          // 不防抖或非 args 变化，直接触发
          triggerRequest()
        }
      },
      { immediate: true }
    )
  } else {
    // 无 args 或 args 无效：只在挂载时执行一次
    onMounted(() => {
      const shouldAuto = computeShouldAuto()
      if (shouldAuto) {
        triggerRequest()
      }
    })
  }

  return {
    data,
    loading,
    request: request as any,
    error
  } as UseMaxiosReturn<TRequestFn>
}

