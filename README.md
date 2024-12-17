Certainly! Below is the translated content from **README_zh.md** into English, which you can use to replace the content in **README.md**.

**File: /Users/admin/Documents/projects/maxios/README.md**
```markdown
# Maxios

Maxios is a library based on [Axios](https://axios-http.com) for making data requests. Its main function is to layer Axios configurations and merge them using the most common logic (merge/join/replace, etc.).

## Motivation

Although there are countless similar libraries on the market, I haven't encountered any that can manage various common request configurations in a layered manner during daily development. For example, when you want to handle errors, if you use Axios directly, you might use its interceptors for global error handling (e.g., error prompts). However, in some special scenarios, you might want certain requests to handle errors independently without triggering the global error logic. Or you may want to add specific error-handling logic for certain modules while ensuring that the global error logic works as expected. If you want to manage common request configurations in a layered way and control whether upper-layer configurations are effective at any time, Maxios is your best choice.

## Installation and Import

You can install Maxios via Yarn or NPM:

```sh
# npm
npm install @awey/maxios

# yarn
yarn add @awey/maxios
```

Then, import Maxios into your code:

```ts
import { globalConfig, modulize } from '@awey/maxios'

globalConfig({
  baseUrl: '/api'
})

const request = modulize({
  baseUrl: '/user'
})

request().success(users => {/* Business logic */})
```

## Best Practices

Maxios recommends organizing your requests into different model files after completing the global request configuration. Then, import the models in your business code and use the methods within them to initiate requests.

First, configure the global request:

```ts
/* global-config.ts */
import { globalConfig } from '@awey/maxios'

globalConfig({
  baseUrl: '/api'
}, {
  requestError (err) {/* handle error */}, // Logic for handling request errors
  expect: response => response.data.code === 0, // Whether the server response meets expectations
  error (data) {/* handle error */}, // Logic for handling unexpected server responses
  extractor: response => response.data.data, // How to extract business data from AxiosResponse when the request is as expected
  // ...other configurations
})
```

Then create model files to categorize requests:

```ts
/* models/user.ts */
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

const request = modulize({
  baseURL: '/user'
})

// It is recommended to expose the entire model's interface as an object
export default Object.freeze({
  getUsers (condition: Partial<UserInfo>) {
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

// Alternatively, each interface can be returned independently
export const createUser = (userInfo: UserInfo) => {
  return request<UserInfo, ResponseData<User>>({
    method: 'POST',
    data: userInfo
  })
}
```

Finally, in your business code, import the model you defined to write business logic (Maxios supports use in any framework, the example below uses React):

```tsx
/** Business code */
import { useState } from 'react'
import userModel, { User } from 'model/user'

const [usersLoading, setUsersLoading] = useState(false)
const [users, setUsers] = useState<User[]>([])

// Returning the model as an object is recommended because it enhances the readability of your business code
// Also, your methods can be named more concisely with the model prefix
userModel.getUsers({ name: 'Tony'})
  .loading(setUsersLoading)
  .success(setUsers)
```

## Chained Calls

The `request()` function returned by `modulize()` returns an object that supports chained calls. As shown in the code above, you can use methods like `loading()`, `success()`, etc., in a chained manner after `getUsers()`, making your code more concise and elegant.

This object that supports chained calls provides the following methods for you to use:

* `loading`: This method accepts a callback function that is called when the loading state of the request changes; the callback function accepts a `boolean` type `status` parameter to indicate the current loading state; it can return `false` to prevent higher-level callback functions from executing
* `requestError`: This method accepts a callback function that is called when a request error occurs; the callback function accepts an `AxiosError` type `error` parameter to indicate the current error information; it can return `false` to prevent higher-level callback functions from executing
* `error`: This method accepts a callback function that is called when the `expect` in Maxios configuration returns `false`; it accepts a `data` parameter of type `OriginResult` to indicate the original data returned by the server; it can return `false` to prevent higher-level callback functions from executing
* `success`: This method accepts a callback function that is called when the `expect` in Maxios configuration returns `true`; it accepts a `data` parameter of type `FinalResult` to indicate the data extracted from the server's response by the `extractor` in Maxios configuration; it can return `false` to prevent higher-level callback functions from executing
* `anyway`: This method accepts a callback function that is always called regardless of what happens with the request; the callback function has two parameters, the first parameter `result` represents the result of the request, which may be an `AxiosResponse` or an `AxiosError`, and the second parameter `config` represents the final configuration information used for the current request; it can return `false` to prevent higher-level callback functions from executing
* `abort`: This method is used to cancel the request

## API Overview

Maxios provides the following APIs:

* `globalConfig(axiosConfig, MaxiosConfig)`: This method is used to set global request configurations, the first parameter is the configuration passed to Axios, and the second parameter is the configuration passed to Maxios
* `modulize(axiosConfig, maxiosConfig)`: This method is used to obtain a modular request method, the first parameter is the configuration passed to Axios, and the second parameter is the configuration passed to Maxios, it returns a `request(axiosConfig, maxiosConfig)` method
* `request(axiosConfig, maxiosConfig)`: The method returned by `modulize()`, used to initiate requests; it accepts the same parameters as `globalConfig()` and `modulize()`, the first parameter is the configuration passed to Axios, and the second parameter is the configuration passed to Maxios; it returns a chained call object introduced earlier
* `race(requests)`: This method is used to make multiple requests in a race condition, using the result of the first returned request as its result; it accepts an array composed of chained objects returned by the `request()` method mentioned earlier; it also returns a chained call object
* `all(requests)`: This method is used to initiate multiple requests simultaneously and use the results of all requests as its result; it accepts an array composed of chained objects returned by the `request()` method mentioned earlier; it also returns a chained call object

It should be noted that to get a complete type hint experience, you need to specify specific types for its generics when calling the `request` method. It accepts three generics:

* `Payload`: The type of payload data for the request, i.e., the type of data attached to the `body` of the request
* `OriginResult`: The data type of the original result returned by the request
* `FinalResult`: The data type of the result returned by the request after being extracted by the `extractor` (the `extractor` will be explained in detail later)

It is worth noting that all places that accept `axiosConfig` and `maxiosConfig` parameters also accept a function that returns a configuration object as a parameter. For example:

```ts
globalConfig(() => ({
  baseUrl: 'api',
  headers: {
    token: localStorage.getItem('auth-token')
  }
}))
```

When some configurations need to be dynamically obtained for each request, using functional configuration is a better choice.

## Axios Configuration Merging Strategy

> For `axiosConfig`, please refer to the [Axios](https://axios-http.com) official website.

As mentioned earlier, you can manage Axios configuration information for the same request at different levels through different Maxios APIs. This is also the core purpose and function of Maxios.

Axios has many configuration items, but in general, Maxios follows the strategy of "the lower the level, the higher the priority" to merge configurations at each level. Specifically, it is `request > modulize > globalConfig`. Most configurations in the Axios configuration object will be directly replaced (replace) by higher-priority configurations with the same name, but some special configurations use different merging strategies in Maxios.

* `baseURL`: The `baseURL` configured at different levels will use the "Path Join" strategy, with higher levels in front and lower levels behind. For example, if `/api` is configured in `global`, `/setting` in `module`, and `/role` in `request`, the final request's `baseURL` will be `/api/setting/role`
* `headers`: The `headers` objects configured at all levels will be merged into one object before the final request through a method similar to `Object.assign`
* `params`: The `params` objects configured at all levels will be merged into one object before the final request through a method similar to `Object.assign`
* `data`: The `data` objects configured at all levels will be merged into one object before the final request through a method similar to `Object.assign`; however, it should be noted that if `data` is not a simple object at any level, the final request will use that configuration

## Common Maxios Configurations

The second parameter `maxiosConfig` of `globalConfig`, `modulize`, and `request` represents the configuration object provided to Maxios. Maxios supports the following common configurations:

* `requestError: AxiosError => boolean | void`: When a request error occurs (unable to obtain response data), you may want to handle it (e.g., prompt the user that the request failed), you can use `requestError` to configure a callback function for handling; the callback function accepts an `AxiosError` representing the request error information as the only parameter; the chained call object mentioned earlier also provides a method with the same name, which has the same effect
* `expect: AxiosResponse => boolean`: A callback function used to determine whether the response returned by the request meets expectations. If it returns `false`, the response is considered not to meet expectations, and Maxios will call the callback function configured in `error()` below; if it returns `true`, the response is considered to meet expectations, and the callback function configured in `success` will be called; the callback function accepts an `AxiosResponse` representing the response information as the only parameter
* `error: OriginResult => boolean | void`: When the request returns data that does not meet expectations, if you need to handle this situation, you can use `error` to configure some callback functions for handling; the callback function accepts an `OriginResult` representing the original response data (obtained from the response information object) as the only parameter; the chained call object mentioned earlier also provides a method with the same name, which has the same effect
* `extractor: OriginResult => FinalResult`: When the request returns data that meets expectations, there may be some common structures in the outermost layer of the data, and the `success` processing logic may not care about these common structures. At this time, you can use `extractor` to strip the outer structure and extract business data; the callback function accepts an `OriginResult` parameter representing the original return data, and it needs to return the extracted business data; the default extraction logic is to directly extract the original response data
* `success: FinalResult => boolean | void`: When the request returns data that meets expectations, your subsequent business logic can use `success` for processing; the chained call object mentioned earlier also provides a method with the same name, which has the same effect
* `loading: Boolean => boolean | void`: This configuration is used to indicate the loading state of the request; when the loading state of the request changes, this callback function will be called; the callback function accepts a `boolean` representing whether it is currently loading as the only parameter; the chained call object mentioned earlier also provides a method with the same name, which has the same effect
* `anyway: (AxiosResponse | AxiosError) => boolean | void`: Regardless of the result of the request, this callback function will always be called after the request ends; the callback function accepts a single parameter to represent the response information or response error information; the chained call object mentioned earlier also provides a method with the same name, which has the same effect

### Priority Strategy for Common Maxios Configurations

The following configurations follow the strategy of "the lower the level, the higher the priority", and after the lower-level configuration, the same name configuration of the upper level will not take effect:

* `expect`
* `extractor`

The following configurations will take effect at all levels, and the execution order is from low to high; if the callback function of the lower level does not want the callback of the upper level to continue executing, it can interrupt the execution of subsequent higher-level callback functions by returning `false`:

* `requestError`
* `error`
* `success`
* `loading`
* `anyway`

It is worth noting that for these configurations (callback functions) that will be executed at all levels, there are actually four levels (the lowest level is the chained call object mentioned earlier), and these levels are from high to low:

* `globalConfig`
* `modulize`
* `request`
* Chained call object

## Advanced Configurations

Maxios also provides some advanced configurations. These configurations correspond to functions that are not commonly used, but once you have the corresponding needs, they will perfectly help you handle all the dirty work.

## Retry Requests

Maxios provides a request retry function. You can specify conditions under which to retry requests. This feature is particularly useful in certain scenarios, such as when you start using a dual-token (Access Token / Refresh Token) mechanism to provide seamless renewal functionality for user authentication, Maxios's retry feature can come in handy.

* `retryWhen`: Request retry logic
  * `retryWhen.requestSuccess`: Retry logic after a successful request
    * `retryWhen.requestSuccess.beforeRetry?: () => Promise | boolean | void`: Logic to be executed before each retry. If `Promise.reject()` or `false` is returned, the subsequent retry logic will be stopped
    * `retryWhen.requestSuccess.condition?: AxiosResponse => boolean`: Retry condition
    * `retryWhen.requestSuccess.retryOthers?: boolean | 'module' | 'global'`: Whether to cancel and retry other ongoing requests during retry
    * `retryWhen.requestSuccess.maximumCount?: number`: Maximum number of retries
  * `retryWhen.requestError`: This configuration represents the retry logic after a request failure
    * `retryWhen.requestError.beforeRetry?: () => Promise | void`: Logic to be executed before each retry
    * `retryWhen.requestError.condition?: AxiosError => boolean`: Retry condition
    * `retryWhen.requestError.retryOthers?: boolean | 'module' | 'global'`: Whether to cancel and retry other ongoing requests during retry
    * `retryWhen.requestError.maximumCount?: number`: Maximum number of retries, default is 1

### Result Caching

Maxios provides a request result caching function. If some requests return data with a very low update frequency and are requested frequently across the client, you can consider using result caching to reduce the number of real requests. The related configurations for request result caching are as follows:

* `cache`: Request result caching logic
  * `cache.type`: Specify the type of cache to use, which can be `memory`, `session` (`window.sessionStorage`), or `local` (`window.localStorage`)
  * `cache.key`: Cache key, used to identify and retrieve cached results

### Custom Request Method

Maxios uses `axios.request()` by default to initiate requests. In some cases (such as when you want to add some Ajax probes to your application to collect performance data and error information of Ajax requests), you may want to customize the request method. You can use the `maxiosConfig.request` configuration to let Maxios use the request method you provide to initiate requests. The type signature of this configuration is as follows:

```ts
type TRequest = <T = unknown, R = AxiosResponse<T>, D = any> (config: AxiosRequestConfig<D>) => Promise<R>
```

## Migrating from V1 to V2

If you are upgrading from V1 to V2, you can check the following checklist for the changes you need to make:

1. `global()` is renamed to `globalConfig()`, and the parameters have changed from one to two, with `axiosConfig` separated from `maxiosConfig` as the first parameter
2. The parameters of `modulize()` and `request()` have changed from one to two, with `axiosConfig` separated from `maxiosConfig` as the first parameter
3. The callback function configuration for request errors `maxiosConfig.error` is renamed to `maxiosConfig.requestError`, and the return value for interrupting subsequent level execution has changed from `true` to `false`
4. The function for determining whether the response meets expectations `indicator` is renamed to `expect`
5. The callback function configuration 