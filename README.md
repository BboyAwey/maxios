# Maxios

Maxios is a library for making data requests based on [Axios](https://axios-http.com). It primarily focuses on layering Axios configurations and merging them using the most commonly used logic (merge/join/replace, etc.).

## Motivation

Although there are countless similar libraries on the market, I haven't come across one that manages commonly used configurations for requests in a layered way during my daily development. For instance, when handling errors, if you're using Axios directly, you might use its interceptors for global error handling (e.g., error prompts). However, in some special scenarios, you might want certain requests to handle errors independently without triggering the global error logic. Or you may want to add specific error-handling logic for certain modules while ensuring that the global error logic works as expected. If you want to manage common request configurations in a layered way and control whether upper-layer configurations are effective at any time, Maxios is your best choice.

## Installation and Import

You can install Maxios via Yarn or NPM:

```sh
# npm
npm install @awey/maxio

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

First, configure global requests:

```ts
/* global-config.ts */
import { globalConfig } from '@awey/maxios'

globalConfig({
  baseUrl: '/api'
}, {
  requestError (err) {/* Handle request errors */},
  expect: response => response.data.code === 0, // Check if the server response meets expectations
  error (data) {/* Handle server response errors */},
  extractor: response => response.data.data, // Extract business data from AxiosResponse
  // ...Other configurations
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

// It is recommended to expose the entire model interface as an object
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

// Alternatively, you can return individual interfaces independently
export const createUser = (userInfo: UserInfo) => {
  return request<UserInfo, ResponseData<User>>({
    method: 'POST',
    data: userInfo
  })
}
```

Finally, import the defined models in your business code to write business logic (Maxios supports use in any framework; the example below uses React):

```tsx
/** Business Code */
import { useState } from 'react'
import userModel, { User } from 'model/user'

const [usersLoading, setUsersLoading] = useState(false)
const [users, setUsers] = useState<User[]>([])

// Returning models as objects improves code readability
// Methods also have the model prefix, allowing simpler naming
userModel.getUsers({ name: 'Tony'})
  .loading(setUsersLoading)
  .success(setUsers)
```

## Chained Calls

The `request()` function returned by `modulize()` provides an object that supports chained calls. As shown in the code above, you can use methods like `loading()` and `success()` in a chained manner after calling `getUsers()`, making your code cleaner and more concise.

This chainable object offers the following methods:

- `loading`: Accepts a callback function that is called when the loading state changes. The callback receives a `boolean` status representing the current loading state. It can return `false` to prevent higher-level callbacks from executing.
- `requestError`: Accepts a callback function that is called when a request error occurs. The callback receives an `AxiosError` representing the error information. It can return `false` to prevent higher-level callbacks from executing.
- `error`: Accepts a callback function called when the `expect` configuration in Maxios returns `false`. It receives an `OriginResult` representing the raw server response data. It can return `false` to prevent higher-level callbacks from executing.
- `success`: Accepts a callback function called when the `expect` configuration in Maxios returns `true`. It receives a `FinalResult` representing the data extracted by the `extractor` configuration. It can return `false` to prevent higher-level callbacks from executing.
- `anyway`: Accepts a callback function that is always called, regardless of the request's outcome. The callback receives two arguments: `result` (which could be an `AxiosResponse` or `AxiosError`) and `config` (representing the final request configuration). It can return `false` to prevent higher-level callbacks from executing.
- `abort`: Used to cancel the request.

## API Overview

Maxios provides the following APIs:

- `globalConfig(axiosConfig, maxiosConfig)`: Sets global request configurations. The first parameter is for Axios configurations, and the second is for Maxios configurations.
- `modulize(axiosConfig, maxiosConfig)`: Obtains modularized request methods. The first parameter is for Axios configurations, and the second is for Maxios configurations. It returns a `request(axiosConfig, maxiosConfig)` method.
- `request(axiosConfig, maxiosConfig)`: Method returned by `modulize()`, used to initiate requests. Its parameters are the same as those of `globalConfig()` and `modulize()`. It returns a chainable object as described above.
- `race(requests)`: Sends multiple requests in a race condition, using the result of the first completed request. It accepts an array of chainable objects returned by `request()`. It also returns a chainable object.
- `all(requests)`: Sends multiple requests simultaneously, using all results as its outcome. It accepts an array of chainable objects returned by `request()`. It also returns a chainable object.

When using the `request` method, specify the following generic types to enjoy complete type hints:

- `Payload`: The type of payload data sent in the request body.
- `OriginResult`: The type of raw data returned by the request.
- `FinalResult`: The type of extracted data after applying the `extractor`.

To dynamically generate configurations for each request, use a function instead of a static object:

```ts
globalConfig(() => ({
  baseUrl: 'api',
  headers: {
    token: localStorage.getItem('auth-token')
  }
}))
```

## Axios Configuration Merging Strategy

Refer to the [Axios documentation](https://axios-http.com) for details on `axiosConfig` options.

In general, Maxios merges configurations based on the "lower level has higher priority" strategy, i.e., `request > modulize > globalConfig`. Most Axios configuration fields are replaced directly by higher-priority configurations, but some have different merging strategies:

- `baseURL`: Uses a "Path Join" strategy, joining paths from higher to lower levels. For example, if `/api` is set in `globalConfig`, `/setting` in `modulize`, and `/role` in `request`, the final `baseURL` will be `/api/setting/role`.
- `headers`: Merges all levels using `Object.assign`.
- `params`: Merges all levels using `Object.assign`.
- `data`: Merges all levels using `Object.assign`, unless any level specifies non-object data, in which case the non-object data takes precedence.

## Advanced Configurations

Maxios also offers advanced configurations to handle complex scenarios effectively.

### Retry Requests

Maxios provides a request retry mechanism. You can specify conditions under which a request should be retried. This is particularly useful for implementing token refresh mechanisms or handling intermittent network issues.

- `retryWhen`: Defines retry logic.
  - `retryWhen.requestSuccess`: Logic for retrying after a successful request.
    - `beforeRetry`: An optional callback executed before each retry.
    - `condition`: A function determining whether to retry based on the response.
    - `retryOthers`: Indicates whether to cancel and retry other pending requests.
    - `maximumCount`: Specifies the maximum number of retries.
  - `retryWhen.requestError`: Logic for retrying after a failed request.
    - `beforeRetry`: An optional callback executed before each retry.
    - `condition`: A function determining whether to retry based on the error.
    - `retryOthers`: Indicates whether to cancel and retry other pending requests.
    - `maximumCount`: Specifies the maximum number of retries (default is 1).

### Response Caching

Maxios includes a response caching mechanism to reduce redundant requests for frequently accessed, rarely updated data. Use the `cache` configuration to enable caching:

- `cache.type`: Specifies the cache type (`memory`, `session`, or `local`).
- `cache.key`: Defines the cache key for identifying and storing responses.

### Custom Request Methods

Maxios defaults to using `axios.request()` for making HTTP requests. If you need to customize the request method, such as for adding performance tracking or error monitoring, you can define a custom request handler using the `maxiosConfig.request` option. The custom request function should have the following signature:

```ts
type TRequest = <T = unknown, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) => Promise<R>
```

## Migration from V1 to V2

If you are upgrading from V1 to V2, consider the following changes:

1. `global()` has been renamed to `globalConfig()`, and its parameters have been split into two: `axiosConfig` and `maxiosConfig`.
2. `modulize()` and `request()` now accept two parameters: `axiosConfig` and `maxiosConfig`.
3. The callback for handling request errors has been renamed from `maxiosConfig.error` to `maxiosConfig.requestError`, and the return value for halting higher-level callbacks has changed from `true` to `false`.
4. The `indicator` function for determining whether a response meets expectations has been renamed to `expect`.
5. The callback for handling responses that do not meet expectations has been renamed from `maxiosConfig.bizError` to `maxiosConfig.error`, and the return value for halting higher-level callbacks has changed from `true` to `false`.
6. Callback execution order for `loading`, `success`, and `anyway` has been adjusted from high-level to low-level, with the ability to interrupt higher-level callbacks by returning `false`.

## Ecosystem

Maxios provides additional tools for integrating with React and Vue frameworks:

- [maxios-react](https://github.com/BboyAwey/maxios-react): A React hook-based integration.
- [maxios-vue](https://github.com/BboyAwey/maxios-vue): A Vue Composition API integration.
