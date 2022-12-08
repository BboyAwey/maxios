
# Maxios

Use axios to fetch data, but configure every api with 4 levels of configurations. And It will handle the most important and frequently used configurations of axios properly (merge, join or replace). Additionally, seperate remote apis to diffirent modules is the recommand way to use Maxios.

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
import { modulize } from '@awey/maxios'

// get modulized request function
const request = modulize({
  axiosConfig: {
    baseURL: '/order'
  }
})

// use request function to access the /order api
request().success(res => {
  // do anything
})
```

But the recommanded way to use Maxios is modulize your apis as an object model. you can create a file named `src/models/user.ts`:

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
  axiosConfig: {
    baseURL: '/user'
  }
})

// modulize your apis
export default Object.frees({
  getUsers (condition: Patial<UserInfo>) {
    return request<void, ResponseData<User[]>>({
      axiosConfig: {
        params: condition
      }
    })
  },

  getUserById (id: number) {
    return request<void, ResponseData<User>>({
      axiosConfig: {
        url: `/${id}`
      }
    })
  },

  createUser (userInfo: UserInfo) {
    return request<UserInfo, ResponseData<User>>({
      axiosConfig: {
        method: 'POST',
        data: userInfo
      }
    })
  },

  deleteUserById (id: number) {
    return request<void, ResponseData<void>>({
      axiosConfig: {
        url: `/${id}`,
        method: 'DELETE'
      }
    })
  },

  updateUser (user: User) {
    return request<user, ResponseData<void>>({
      axiosConfig: {
        url: `/${user.id}`,
        method: 'PUT'
      }
    })
  }
})
```

And you can use those user model apis like below:

```ts
import userModel from 'src/model/user'

userModel.getUsers({ name: 'Tony'})
  .success(res => console.log(res.data))
```

## Configuration

> All places that accept this config object also accept a function that returns it

A Maxios config object is like below:

```typescript
interface IMaxiosConfig {
  axiosConfig?: AxiosRequestConfig<Payload>
  indicator?: TIndicator<OriginResult>
  extractor?: TExtractor<Payload, OriginResult, FinalResult>
  request?: TRequest
  cache?: {
    type: TCacheType
    key: string
  }
  cancelable?: boolean
  loading?: TLoading
  error?: TRequestError<Payload, OriginResult>
  bizError?: TBizError<OriginResult>
  success?: TSuccess<FinalResult>
  anyway?: TAnyway
}
```

* `axiosConfig`: any configuration that `Axios.request()` accept. If the corresponding api configuration has axiosConfig too, they will be merged before request send
* `indicator`: a function which is used to indicate if the response data is correct. It accepts the origin response data as the only argument, and if it returns `true`, then the `success` handler will be executed otherwise the `bizError` handler will be executed. The default indicator is `() => true`
* `extractor`: a function which is used to extract data from origin axios response data and the result will be pass to `success` handler. The default extractor is `(res: AxiosResponse<OriginResult, Payload>) => res.data`
* `request`: a custome request fucntion. Maxios use `axios.request()` to send request to remote service by default, but if `request` is defined here it will use it instead. It accepts an axios request config object as the only argument and should return a promise instance
* `cache`: specifies should maxios use caching for the response data
  * `cache.type`: specifies which type of caching should maxios use to store the response data. It should be one of the `memory`, `session`(session storage) or `local`(local storage)
  * `cache.key`: a key which is used to store the response data in cache
* `cancelable`: indicate if this fetch can be canceled. If `true` then this fetch will be canceled by `maxios.cancelActiveRequests()`
* `loading`: a callback function which will be executed when fetch loading status changed. It recieves an argument `status` to indecate if it is loading right now
* `error`: a callback function which will be executed when response status code is not right. It recieves an argument `axiosError`. And it can return `true` to use next `error` callbacks from upper layers
* `bizError`: a callback function which will be executed when `indicator` returns false. It recieves an argument `data` as the origin response data. And it can return `true` to executed next `bizError` callbacks from upper layers
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
* `cancelable`: if there's any `cancelable` is `true` in config from any level, then this request could be canceled by `Maxios.cancelActiveRequests()`
* `loading`: all loading callbacks will executed from high level to low level(executing order is not that important).
* `error`: error callbacks will executed from low level to high level. And if any of the callbacks do not return `true`, then the upper level callbacks will not be executed.
* `bizError`: bizError callbacks will executed from low level to high level. And if any of the callbacks do not return `true`, then the upper level callbacks will not be executed.
* `success`: all sucecss callback will executed from high level to low level.
* `anyway`: all anyway callbacks will executed from high level to low level.

## Callback Chain

`request()` function from `modulize()` will return a chain object which contains `loading`,`error`,`bizError`,`success` and `anyway` functions. And all those functions will still return the chain object so that you can call those functions chainly.

They are the same as the callbacks in configuration object. And the latter-called function has a higher level. They all follow the same priorities above.

## Maxios API

`global(config: IMaxiosConfig | () => IMaxiosConfig) => void`: global configuration function
`modulize(config: IMaxiosConfig | () => IMaxiosConfig) => ModulizedReqFunc`: a function that can set a module configuration and return a modulized request function
`Maxios.cancelActiveRequests() => void`: a function that used to cancel all active requests
