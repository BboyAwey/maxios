import { globalConfig, modulize, race, all } from '../src'

interface Response<T> {
  code: number
  data?: T
  msg: string
}

interface User {
  id: number
  name: string
  age: number
}

// ========== 全局配置 ==========
globalConfig<Response<unknown>>(
  {
    baseURL: '/api',
    headers: {
      'X-Global-Header': 'from-global-config'
    }
  },
  {
    expect(response) {
      return response.data.code === 0
    },
    extractor(response) {
      return response.data.data
    },
    loading: (status) => {
      console.log('[Global] Loading:', status)
      updateLog(`[Global] Loading: ${status}`)
    },
    error: (data) => {
      console.log('[Global] Business Error:', data)
      updateLog(`[Global] Business Error: ${JSON.stringify(data)}`)
    },
    requestError: (err) => {
      console.log('[Global] Request Error:', err.message)
      updateLog(`[Global] Request Error: ${err.message}`)
    }
  }
)

// ========== 模块化请求 ==========
const userRequest = modulize<Response<unknown>>(
  {
    headers: {
      'X-Module-Header': 'from-module-config'
    }
  },
  {
    loading: (status) => {
      console.log('[Module] Loading:', status)
      updateLog(`[Module] Loading: ${status}`)
    }
  }
)

// ========== API 定义 ==========
const apis = {
  // 基本 GET 请求
  getUsers(params?: { name?: string }) {
    return userRequest<void, Response<{ users: User[], query: any }>>({
      url: '/users',
      params
    })
  },

  // POST 请求
  createUser(userInfo: { name: string; age: number }) {
    return userRequest<{ name: string; age: number }, Response<User>>({
      url: '/post-shit',
      method: 'POST',
      data: userInfo
    })
  },

  // PUT 请求
  updateUser(id: number, userInfo: { name?: string; age?: number }) {
    return userRequest<{ id: number; name?: string; age?: number }, Response<User>>({
      url: '/put-shit',
      method: 'PUT',
      data: { id, ...userInfo }
    })
  },

  // DELETE 请求
  deleteUser(id: number) {
    return userRequest<void, Response<{ id: number }>>({
      url: '/delete-shit',
      method: 'DELETE',
      params: { id }
    })
  },

  // 缓存测试
  getCachedData() {
    return userRequest<void, Response<{ timestamp: number; message: string }>>({
      url: '/cached-data'
    }, {
      cache: {
        type: 'memory',
        key: 'cached-data'
      }
    })
  },

  // 重试测试（HTTP 错误）
  getRetryTest() {
    return userRequest<void, Response<{ message: string; attempts: number }>>({
      url: '/retry-test'
    }, {
      retryWhen: {
        requestError: {
          condition: (err) => err.response?.status === 500,
          maximumCount: 3,
          beforeRetry: () => {
            console.log('[Retry] Before retry...')
            updateLog('[Retry] Before retry...')
          }
        }
      }
    })
  },

  // 重试测试（业务错误）
  getBizRetryTest() {
    return userRequest<void, Response<{ message: string; attempts: number }>>({
      url: '/biz-retry-test'
    }, {
      retryWhen: {
        requestSuccess: {
          condition: (res) => res.data.code !== 0,
          maximumCount: 3,
          beforeRetry: () => {
            console.log('[Biz Retry] Before retry...')
            updateLog('[Biz Retry] Before retry...')
          }
        }
      }
    })
  },

  // 快速请求（用于 race）
  getFastRequest() {
    return userRequest<void, Response<{ message: string; delay: number }>>({
      url: '/fast-request'
    })
  },

  // 慢速请求（用于 race）
  getSlowRequest() {
    return userRequest<void, Response<{ message: string; delay: number }>>({
      url: '/slow-request'
    })
  },

  // 并发请求（用于 all）
  getRequest1() {
    return userRequest<void, Response<{ id: number; message: string }>>({
      url: '/request-1'
    })
  },

  getRequest2() {
    return userRequest<void, Response<{ id: number; message: string }>>({
      url: '/request-2'
    })
  },

  getRequest3() {
    return userRequest<void, Response<{ id: number; message: string }>>({
      url: '/request-3'
    })
  },

  // HTTP 错误测试
  getHttpError() {
    return userRequest<void, Response<unknown>>({
      url: '/http-error-shit'
    })
  },

  // 业务错误测试
  getBizError() {
    return userRequest<void, Response<unknown>>({
      url: '/biz-error-shit'
    })
  }
}

// ========== UI 辅助函数 ==========
function updateLog(message: string) {
  const logDiv = document.getElementById('log')
  if (logDiv) {
    const logEntry = document.createElement('div')
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
    logEntry.style.padding = '4px'
    logEntry.style.borderBottom = '1px solid #eee'
    logDiv.appendChild(logEntry)
    logDiv.scrollTop = logDiv.scrollHeight
  }
}

function clearLog() {
  const logDiv = document.getElementById('log')
  if (logDiv) {
    logDiv.innerHTML = ''
  }
}

// ========== 基础功能测试 ==========
function testBasicChain() {
  clearLog()
  updateLog('=== 测试基本链式调用 ===')
  
  apis.getUsers({ name: 'Test' })
    .loading((status) => {
      updateLog(`Loading callback: ${status}`)
    })
    .success((data) => {
      updateLog(`Success: ${JSON.stringify(data)}`)
    })
    .error((data) => {
      updateLog(`Business Error: ${JSON.stringify(data)}`)
    })
    .requestError((err) => {
      updateLog(`Request Error: ${err.message}`)
    })
    .anyway(() => {
      updateLog(`Anyway callback called`)
    })
}

function testAbort() {
  clearLog()
  updateLog('=== 测试 Abort 功能 ===')
  
  const chain = apis.getUsers()
    .loading((status) => {
      updateLog(`Loading: ${status}`)
    })
    .success((data) => {
      updateLog(`Success: ${JSON.stringify(data)}`)
    })
  
  updateLog('Request started, will abort in 100ms...')
  setTimeout(() => {
    chain.abort()
    updateLog('Request aborted!')
  }, 100)
}

function testCache() {
  clearLog()
  updateLog('=== 测试缓存功能 ===')
  
  const testCache = () => {
    const startTime = Date.now()
    apis.getCachedData()
      .success((data) => {
        const elapsed = Date.now() - startTime
        updateLog(`Cached data received in ${elapsed}ms: ${JSON.stringify(data)}`)
      })
  }
  
  updateLog('First request (should be slow)...')
  testCache()
  
  setTimeout(() => {
    updateLog('Second request (should be fast from cache)...')
    testCache()
  }, 1000)
}

function testRetry() {
  clearLog()
  updateLog('=== 测试重试功能（HTTP 错误）===')
  
  apis.getRetryTest()
    .loading((status) => {
      updateLog(`Loading: ${status}`)
    })
    .success((data) => {
      updateLog(`Success after retries: ${JSON.stringify(data)}`)
    })
    .requestError((err) => {
      updateLog(`Request Error: ${err.message}`)
    })
}

function testBizRetry() {
  clearLog()
  updateLog('=== 测试重试功能（业务错误）===')
  
  apis.getBizRetryTest()
    .loading((status) => {
      updateLog(`Loading: ${status}`)
    })
    .success((data) => {
      updateLog(`Success after retries: ${JSON.stringify(data)}`)
    })
    .error((data) => {
      updateLog(`Business Error: ${JSON.stringify(data)}`)
    })
}

function testRace() {
  clearLog()
  updateLog('=== 测试 Race 功能 ===')
  
  race([
    apis.getSlowRequest(),
    apis.getFastRequest()
  ])
    .loading((status) => {
      updateLog(`Race Loading: ${status}`)
    })
    .success((data) => {
      updateLog(`Race Success (first to complete): ${JSON.stringify(data)}`)
    })
}

function testAll() {
  clearLog()
  updateLog('=== 测试 All 功能 ===')
  
  all([
    apis.getRequest1(),
    apis.getRequest2(),
    apis.getRequest3()
  ])
    .loading((status) => {
      updateLog(`All Loading: ${status}`)
    })
    .success((data) => {
      updateLog(`All Success (all completed): ${JSON.stringify(data)}`)
    })
}

function testErrorHandling() {
  clearLog()
  updateLog('=== 测试错误处理 ===')
  
  updateLog('1. Testing HTTP Error...')
  apis.getHttpError()
    .requestError((err) => {
      updateLog(`HTTP Error caught: ${err.message}`)
    })
    .anyway(() => {
      updateLog('HTTP Error anyway callback')
    })
  
  setTimeout(() => {
    updateLog('2. Testing Business Error...')
    apis.getBizError()
      .error((data) => {
        updateLog(`Business Error caught: ${JSON.stringify(data)}`)
      })
      .anyway(() => {
        updateLog('Business Error anyway callback')
      })
  }, 1000)
}

// ========== React Hook 测试组件 ==========
function createReactDemo() {
  const container = document.getElementById('react-demo')
  if (!container) return

  // 简单的 React-like 渲染（不使用真正的 React，只是演示概念）
  container.innerHTML = `
    <div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
      <h3>React Hook Demo (Conceptual)</h3>
      <p>In a real React app, you would use:</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">
const { request, data: users, loading, error } = useMaxios(apis.getUsers, { name: 'React' })
      </pre>
      <button onclick="testReactHook()" style="padding: 8px 16px; margin: 5px;">Test React Hook</button>
      <div id="react-result" style="margin-top: 10px;"></div>
    </div>
  `
}

function testReactHook() {
  const resultDiv = document.getElementById('react-result')
  if (!resultDiv) return

  resultDiv.innerHTML = '<p>Loading...</p>'
  
  // 模拟 React hook 的使用
  apis.getUsers({ name: 'React User' })
    .loading((status) => {
      if (status) {
        resultDiv.innerHTML = '<p>Loading...</p>'
      }
    })
    .success((data) => {
      resultDiv.innerHTML = `<p style="color: green;">Success: ${JSON.stringify(data)}</p>`
    })
    .error((data) => {
      resultDiv.innerHTML = `<p style="color: red;">Error: ${JSON.stringify(data)}</p>`
    })
}

// ========== Vue Hook 测试组件 ==========
function createVueDemo() {
  const container = document.getElementById('vue-demo')
  if (!container) return

  container.innerHTML = `
    <div style="padding: 20px; border: 1px solid #ddd; margin: 10px 0;">
      <h3>Vue Hook Demo (Conceptual)</h3>
      <p>In a real Vue app, you would use:</p>
      <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">
const { request, data: users, loading, error } = useMaxios(apis.getUsers, { name: 'Vue' })
      </pre>
      <button onclick="testVueHook()" style="padding: 8px 16px; margin: 5px;">Test Vue Hook</button>
      <div id="vue-result" style="margin-top: 10px;"></div>
    </div>
  `
}

function testVueHook() {
  const resultDiv = document.getElementById('vue-result')
  if (!resultDiv) return

  resultDiv.innerHTML = '<p>Loading...</p>'
  
  // 模拟 Vue hook 的使用
  apis.getUsers({ name: 'Vue User' })
    .loading((status) => {
      if (status) {
        resultDiv.innerHTML = '<p>Loading...</p>'
      }
    })
    .success((data) => {
      resultDiv.innerHTML = `<p style="color: green;">Success: ${JSON.stringify(data)}</p>`
    })
    .error((data) => {
      resultDiv.innerHTML = `<p style="color: red;">Error: ${JSON.stringify(data)}</p>`
    })
}

// ========== 页面初始化 ==========
window.addEventListener('load', () => {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="margin: 0;">Maxios Demo</h1>
        <a href="/demo/hooks-test.html" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          🧪 Hooks 完整测试页面
        </a>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h2>基础功能测试</h2>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button onclick="testBasicChain()" style="padding: 10px;">测试链式调用</button>
            <button onclick="testAbort()" style="padding: 10px;">测试 Abort</button>
            <button onclick="testCache()" style="padding: 10px;">测试缓存</button>
            <button onclick="testRetry()" style="padding: 10px;">测试重试（HTTP错误）</button>
            <button onclick="testBizRetry()" style="padding: 10px;">测试重试（业务错误）</button>
            <button onclick="testRace()" style="padding: 10px;">测试 Race</button>
            <button onclick="testAll()" style="padding: 10px;">测试 All</button>
            <button onclick="testErrorHandling()" style="padding: 10px;">测试错误处理</button>
          </div>
        </div>
        
        <div>
          <h2>日志</h2>
          <div id="log" style="height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; background: #f9f9f9; font-family: monospace; font-size: 12px;">
          </div>
          <button onclick="clearLog()" style="margin-top: 10px; padding: 5px 10px;">清空日志</button>
        </div>
      </div>
      
      <div id="react-demo"></div>
      <div id="vue-demo"></div>
    </div>
  `

  // 将函数暴露到全局，以便 HTML 中的 onclick 可以调用
  ;(window as any).testBasicChain = testBasicChain
  ;(window as any).testAbort = testAbort
  ;(window as any).testCache = testCache
  ;(window as any).testRetry = testRetry
  ;(window as any).testBizRetry = testBizRetry
  ;(window as any).testRace = testRace
  ;(window as any).testAll = testAll
  ;(window as any).testErrorHandling = testErrorHandling
  ;(window as any).testReactHook = testReactHook
  ;(window as any).testVueHook = testVueHook
  ;(window as any).clearLog = clearLog

  createReactDemo()
  createVueDemo()
})
