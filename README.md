
# Maxios

Use axios to fetch data, but configure every api with 4 levels of configurations. And It will handle the most important and frequently-used configurations of axios properly (merge, join or replace). Additionally, seperating remote apis to diffirent modules is the recommended way to use Maxios.

## Install

```sh
# NPM
npm install @awey/maxios --save

# Yarn
yarn add @awey/maxios
```

## Usage

A basic example of maxios usage is like below:

```ts
import { globalConfig, modulize } from '@awey/maxios'

// set some global config
globalConfig({
  baseUrl: 'api'
}, {
  expect: response => response.data?.code === 0
  error: response => console.log(response.data.code)
  requestError: axiosError => console.warn(axiosError)
  extractor: response => response.data.data
  request: config => console.log('start to request: ', config)
  anyway: (res, config) => console.log('some ajax calling happens and the result is': res)
})

// get modulized request function
const request = modulize({
  baseURL: '/order'
})

// use request function to access the /order api
request({
  url: '/get-orders',
  params: {
    username: 'Tom'
  }
})
  .loading(loading => console.log('loading status: ' loading))
  .success(res => {
    // do anything
  })
```

But the recommended way to use Maxios is modulize your apis as models. you can create a file named `src/models/user.ts`:

```ts
/* src/models/user.ts */
interface User {
  id: number
  name: string
  age: number
  gender: 'male' | 'female'
}

type UserInfo = Pick<User, 'name', 'age', 'gender'>

interface ResponseData<T> {
  code: number
  msg: string
  data: T
}

// get modulized request function
const request = modulize({
  baseURL: '/user'
})

// modulize your apis as an object
// and this is the recomanded way
export default Object.freeze({
  getUsers (condition: Patial<UserInfo>) {
    return request<void, ResponseData<User[]>>({
      params: condition
    })
  },

  getUserById (id: number) {
    return request<void, ResponseData<User>>({
      url: `/${id}`
    })
  }
})

// or just export model apis one by one
export const createUser = (userInfo: UserInfo) => {
  return request<UserInfo, ResponseData<User>>({
    method: 'POST',
    data: userInfo
  })
}

export const deleteUserById = (id: number) => {
  return request<void, ResponseData<void>>({
    url: `/${id}`,
    method: 'DELETE'
  })
}

export const updateUser = (user: User) => {
  return request<user, ResponseData<void>>({
    url: `/${user.id}`,
    method: 'PUT'
  })
}
```

And you can use those model apis like below:

```ts
import userModel, { deleteUserById } from 'src/model/user'

// use object is better for understanding
userModel.getUsers({ name: 'Tony'})
  .success(res => console.log(res.data))

deleteUserById(1)
  .success(res => console.log(res))
```

## Maxios API

* `globalConfig(axiosConfig: AxiosRequestConfig | () => AxiosRequestConfig, maxiosConfig: TMaxiosConfig | () => TMaxiosConfig) => void`: global configuration function
* `modulize(axiosConfig: AxiosRequestConfig | () => AxiosRequestConfig, maxiosConfig: TMaxiosConfig | () => TMaxiosConfig) => ModulizedReqFunc`: a function that can set a module configuration and return a modulized request function
* `race(requests: IProcessChain[]) => IProcessChain`: a function that can race all giving requests and return a chain object that you can call `loading`,`error`,`bizError`,`success` and `anyway` functions with it
* `all(requests: IProcessChain[]) => IProcessChain`: a function that can get all giving requests's result and return a chain object that you can call `loading`,`error`,`bizError`,`success` and `anyway` functions with it

## Configuration

Both `globalConfig()`, `modulize()` and `request()` from moduleize accept 2 argumenst: `axiosConfig` and `maxiosConfig`.

> All places that accept a config object also accept a function that returns it

An axios config is a config that `axios.request()` needed. you can checkout [Axios](https://axios-http.com/docs/intro) for more details.

A Maxios config object is like below:

```typescript
interface TMaxiosConfig {
  expect?: TExpect<OriginResult>
  extractor?: TExtractor<Payload, OriginResult, FinalResult>
  request?: TRequest
  cache?: {
    type: TCacheType
    key: string
  }
  loading?: TLoading
  error?: TError<Payload, OriginResult>
  requestError?: TRequestError<OriginResult>
  success?: TSuccess<FinalResult>
  anyway?: TAnyway
}
```

* `isError`: a function which is used to indicate if the response data is correct or not. It accepts the origin response data as the only argument. If it's been omitted or if it returns `false`, then the `success` handler will be executed otherwise the `error` handlers will be executed. The default isError indicator is `() => false`
* `extractor`: a function which is used to extract data from origin axios response data and the result will be pass to `success` handler. The default extractor is `(res: AxiosResponse<OriginResult, Payload>) => res.data`
* `request`: a custome request fucntion. Maxios use `axios.request()` to send request to remote service by default, but if `request` is defined here it will use it instead. It accepts an axios request config object as the only argument and should return a promise instance
* `cache`: specifies should maxios use caching for the response data
  * `cache.type`: specifies which type of caching should maxios use to store the response data. It should be one of the `memory`, `session`(session storage) or `local`(local storage)
  * `cache.key`: a key which is used to store the response data in cache
* `loading`: a callback function which will be executed when fetch loading status changed. It recieves an argument `status` to indecate if it is loading right now
* `requestError`: a callback function which will be executed when response status code is not right. It recieves an argument `axiosError`. And it can return `false` to stop Maxios to execute next `requestError` callbacks from upper layers
* `error`: a callback function which will be executed when `isError` returns true. It recieves an argument `data` as the origin response data. And it can return `false` to stop Maxios to execut next `error` callbacks from upper layers
* `success`: a callback function which will be executed when `indicator` returns true. It recieves an argument `data` as the final response data (the data has been handled by `extractor`).
* `anyway`: a callback function which will be always executed.

### Configuration priorities

There are 3 layers configuration that you can provide to a request with Maxios:

```js
- global
  - module
    - api-definition
```

In general, lower-level configurations take precedence over higher-level configurations. But some of it still has there own priorities or strategies.

* `axiosConfig.baseURL`: all the baseURLs will join from low-level into high level. if baseURL from api config is `/get-sth`, and from module config is `/module-a`, and from global config is `/api`, then the final baseURL will be `/api/module-a/get-sth`
* `axiosConfig.headers`: `headers` object will merge from low-level into high level. The final headers object is just like the result of `Object.assign({}, globalConfig.axiosConfig.headers, moduleConfig.axiosConfig.headers, apiConfig.axiosConfig.headers)`
* `axiosConfig.params`: `params` object will merge from low-level into high level, the final params object is just like the result of `Object.assign({}, globalConfig.axiosConfig.params, moduleConfig.axiosConfig.params, apiConfig.axiosConfig.params)`
* `axiosConfig.data`: the `data` property in axios config could be string, plain object, ArrayBuffer, ArrayBufferView, URLSearchParams, FormData, File, Blob, Stream or Buffer. Maxios will merge it from low-level to high level only when they are all **plain objects**, otherwise the high-level data will be replaced by the low-level data.
* `maxiosConfig.loading`: all loading callbacks will executed from high level to low level(executing order is not that important).
* `maxiosConfig.error`: error callbacks will executed from low level to high level. And if any of the callbacks do not return `true`, then the upper level callbacks will not be executed.
* `maxiosConfig.bizError`: bizError callbacks will executed from low level to high level. And if any of the callbacks do not return `true`, then the upper level callbacks will not be executed.
* `maxiosConfig.success`: all sucecss callback will executed from high level to low level.
* `maxiosConfig.anyway`: all anyway callbacks will executed from high level to low level.

## Callback Chain

`request()` function from `modulize()` will return a chain object which contains `loading`,`error`,`bizError`,`success` and `anyway` functions. And all those functions will still return the chain object so that you can call those functions chainly.

They are the same as the callbacks in configuration object. And the latter-called function has a higher level. They all follow the same priorities above.

## Race and All

You can handle multiple requests with `race()` or `all()` function. Just like bellow:

 ```ts
all<[User[], Group[], Room[]]>([
  userModel.getUsers({ gender: 'female' }),
  groupModel.getGroups(),
  roomModel.getRooms({ lang: 'zh' })
])
  .success((res) => {
    console.log('---all success', res)
  })
  .anyway(() => {
    console.log('---all anyway')
  })

race<User[] | Group[] | Room[]>([
  userModel.getUsers({ gender: 'female' }),
  groupModel.getGroups(),
  roomModel.getRooms({ lang: 'zh' })
])
  .success((res) => {
    console.log('---race success', res)
  })
  .anyway(() => {
    console.log('---race anyway')
  })
```

## Retry Requests


## `toPromise()`

Sometimes you will need to convert a request chain object to a standard promise instance, then `toPromise()` function will be a handy util for you.

```ts
toPromise(userModel.getUsers({ gender: 'female' }))
  .then(res => console.log('to promise res', res))
  .catch(error => console.log('to promise error', error))
  .finally(() => console.log('to promise finally'))
```

> ATTENTION: the request chain object should return not return `false` in it's `error` or `requestError` handler if it will be wrapped by `toPromise()`. Otherwise the promise instance will not work as we expected.

## Migration from V1

TODO: