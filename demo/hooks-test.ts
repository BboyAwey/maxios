import { mountReactDemo } from './react-demo'
import VueDemo from './vue-demo.vue'
import { createApp } from 'vue'
import { globalConfig } from '../src'

// ========== 全局配置 ==========
interface Response<T> {
  code: number
  data?: T
  msg: string
}

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
    },
    error: (data) => {
      console.log('[Global] Business Error:', data)
    },
    requestError: (err) => {
      console.log('[Global] Request Error:', err.message)
    }
  }
)

// ========== 等待 DOM 加载完成后挂载组件 ==========
function mountDemos() {
  // ========== 挂载 React Demo ==========
  const reactContainer = document.getElementById('react-demo-container')
  if (reactContainer) {
    try {
      mountReactDemo(reactContainer)
    } catch (error) {
      console.error('Failed to mount React demo:', error)
      reactContainer.innerHTML = `<div style="color: red; padding: 20px;">
        <h3>React Demo 加载失败</h3>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>`
    }
  } else {
    console.error('React demo container not found')
  }

  // ========== 挂载 Vue Demo ==========
  const vueContainer = document.getElementById('vue-demo-container')
  if (vueContainer) {
    try {
      const vueApp = createApp(VueDemo)
      vueApp.mount(vueContainer)
    } catch (error) {
      console.error('Failed to mount Vue demo:', error)
      vueContainer.innerHTML = `<div style="color: red; padding: 20px;">
        <h3>Vue Demo 加载失败</h3>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>`
    }
  } else {
    console.error('Vue demo container not found')
  }
}

// 确保 DOM 已加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountDemos)
} else {
  // DOM 已经加载完成，直接执行
  mountDemos()
}

