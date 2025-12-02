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
  getUsers(params?: { name?: string }) {
    return userRequest<void, Response<{ users: User[], query: any }>>({
      url: '/users',
      params
    })
  }
}

