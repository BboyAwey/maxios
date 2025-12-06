import { modulize } from '../src'

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

const userRequest = modulize<Response<unknown>>({
  headers: {
    'X-Module-Header': 'from-module-config'
  }
})

export const apis = {
  // 无参数的请求函数
  getUsersNoParams() {
    return userRequest<void, Response<{ users: User[] }>>({
      url: '/users'
    })
  },
  
  // 可选参数的请求函数
  getUsers(params?: { name?: string }) {
    return userRequest<void, Response<{ users: User[], query: any }>>({
      url: '/users',
      params
    })
  },
  
  // 必填参数的请求函数
  getUserById(id: number) {
    return userRequest<void, Response<User>>({
      url: `/users/${id}`
    })
  },
  
  // 多参数的请求函数（必填）
  getUserByMultipleParams(id: number, name: string) {
    return userRequest<void, Response<User>>({
      url: `/users/${id}`,
      params: { name }
    })
  },
  
  // 多参数的请求函数（第一个可选）
  searchUsers(query?: string, page?: number) {
    return userRequest<void, Response<{ users: User[], page: number }>>({
      url: '/users/search',
      params: { query, page }
    })
  }
}

