import { globalConfig, modulize } from '../src'

// ========== Types ==========

export interface Response<T> {
  code: number
  data?: T
  msg: string
}

export interface User {
  id: number
  name: string
  age: number
}

// ========== Global config ==========

export function setupGlobalConfig() {
  globalConfig<Response<unknown>>(
    {
      baseURL: '/api',
      headers: { 'X-Global-Header': 'maxios-demo' }
    },
    {
      expect: (res) => res.data.code === 0,
      extractor: (res) => res.data.data,
      loading: (status) => console.log('[Global] Loading:', status),
      error: (data) => console.log('[Global] Business Error:', data),
      requestError: (err) => console.log('[Global] Request Error:', err.message)
    }
  )
}

// ========== User module ==========

const userRequest = modulize<Response<unknown>>({ baseURL: '/users' })

export const userApi = {
  getAll(params?: { name?: string }) {
    return userRequest<void, Response<{ users: User[]; query: any }>>({ params })
  },

  getById(id: number) {
    return userRequest<void, Response<User>>({ url: `/${id}` })
  },

  create(data: { name: string; age: number }) {
    return userRequest<typeof data, Response<User>>({ method: 'POST', data })
  },

  update(id: number, data: { name?: string; age?: number }) {
    return userRequest<typeof data, Response<User>>({ url: `/${id}`, method: 'PUT', data })
  },

  remove(id: number) {
    return userRequest<void, Response<{ id: number }>>({ url: `/${id}`, method: 'DELETE' })
  },

  search(query?: string, page?: number) {
    return userRequest<void, Response<{ users: User[]; page: number }>>({
      url: '/search',
      params: { query, page }
    })
  }
}

// ========== Misc endpoints ==========

const request = modulize<Response<unknown>>()

export const miscApi = {
  httpError() {
    return request<void, Response<unknown>>({ url: '/error/http' })
  },

  bizError() {
    return request<void, Response<unknown>>({ url: '/error/business' })
  },

  cachedData() {
    return request<void, Response<{ timestamp: number; message: string }>>({
      url: '/cached-data'
    }, {
      cache: { type: 'memory', key: 'cached-data' }
    })
  },

  retryTest() {
    return request<void, Response<{ message: string; attempts: number }>>({
      url: '/retry-test'
    }, {
      retryWhen: {
        requestError: {
          condition: (err) => err.response?.status === 500,
          maximumCount: 3,
          beforeRetry: () => console.log('[Retry] Retrying...')
        }
      }
    })
  },

  slowRequest() {
    return request<void, Response<{ message: string; delay: number }>>({ url: '/slow-request' })
  },

  fastRequest() {
    return request<void, Response<{ message: string; delay: number }>>({ url: '/fast-request' })
  },

  getRequest(id: number) {
    return request<void, Response<{ id: number; message: string }>>({ url: `/request/${id}` })
  }
}
