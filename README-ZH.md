
# Maxios

Maiox是一个基于[Axios](https://axios-http.com)封装的，用于请求数据的库。它所做的主要工作是将Axios的配置进行了分层，并且会按照最常用的逻辑（merge/join/replace...）来对这些配置进行合并使用。

## 动机

尽管市面上同类型的库不计其数，但在日常开发中我还没有见到任何一个库能够对请求的各类常用配置进行分层管理的。举个简单例子，当你想要进行错误处理时，通常如果直接使用Axios，你可能会使用它的拦截器来做全局的通用错误处理（错误提示等）。但在一些特殊的场景下，你可能希望某些请求自行处理错误，而不要出发全局的错误处理逻辑。又或者你希望为某些模块添加一些特殊的错误处理逻辑，同时也希望全局的错误处理逻辑能够正常工作。凡此总总，如果能对请求的常用配置进行分层管理，并在任何时候都可以控制上层的配置是否生效，那么使用Maxios就是你最好的选择。

## 安装和引入

你可以通过Yarn或者NPM来安装Maxios：

```sh
# npm
npm install @awey/maxio

# yarn
yarn add @awey/maxios
```

然后在你的代码中引入Maxios：

```ts
import { globalConfig, modulize } from '@awey/maxios'

globalConfig({
  baseUrl: '/api'
})

const request = modulize({
  baseUrl: '/user'
})

request().success(users => {/* 处理业务逻辑 */})
```

## 最佳实践

Maxios推荐的最佳实践是，在完成全局请求配置后，将你的请求组织成不同的Model文件，然后在业务代码中引入Model，并使用其中的方法发起请求。

首先为请求进行全局配置：

```ts
/* global-config.ts */
import { globalConfig } from '@awey/maxios'

globalConfig({
  baseUrl: '/api'
}, {
  requestError (err) {/* do some shit */}, // 请求错误时的处理逻辑
  expect: response => response.data.code === 0, // 服务器返回是否符合预期
  error (data) {/* do some shit */}, // 服务器返回不符合预期时的处理逻辑
  extractor: response => response.data.data, // 请求返回符合预期时，如何从AxiosResponse中提取业务数据
  // ...其他配置
})
```

然后创建Model文件，将请求进行分类：

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

// 推荐的做法是将整个Model的接口作为一个对象暴露
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

// 当然，也可以每个接口独立返回
export const createUser = (userInfo: UserInfo) => {
  return request<UserInfo, ResponseData<User>>({
    method: 'POST',
    data: userInfo
  })
}
```

最后，在你的业务代码中，引入你定义好的Model来编写业务代码（Maxios支持在任何框架中使用，下面以React为例）：

```tsx
/** 业务代码 */
import { useState } from 'react'
import userModel, { User } from 'model/user'

// 推荐将Model作为对象返回是因为这样你的业务代码可读性更强
// 同时你的方法也因为有Model前缀，可以更简洁地进行命名
const [usersLoading, setUsersLoading] = useState(false)
const [users, serUsers] = useState<User[]>([])

userModel.getUsers({ name: 'Tony'})
  .loading(setUsersLoading)
  .success(setUsers)
```

## 链式调用

`modulize()`返回的`request()`函数，返回了一个支持链式调用的对象。就像上面的代码那样，你可以在`getUsers()`之后将`loading()`、`success()`等方法使用链式的方式来进行调用，让你的代码更简洁美观。

这个支持链式调用方法的对象，提供了下列方法供你使用：

* `loading`：该方法接受一个回调函数，该回调函数会在请求的loading状态变化时被调用；回调函数接受一个`boolean`类型的 `status` 参数来表示当前的loading状态
* `requestError`：该方法接受一个回调函数，该回调函数会在请求发生错误时被调用；回调函数接受一个`AxiosError`类型 `axiosError`参数来表示当前的错误信息
* `error`：该方法接受一个回调函数，该回调函数会在Maxios配置中的`expect`返回`false`时被调用；它接受一个类型为`OriginResult`的`data`参数来表示服务器返回的原始数据
* `success`：该方法接受一个回调函数，该回调函数会在Maxios配置中的`expect`返回`true`时被调用；它接受一个类型为`FinalResult`的`data`参数来表示从服务器返回的结果中被Maios配置中的`extractor`提取出来的数据
* `anyway`：该方法接受一个回调函数，无论请求发生了什么，该回函数总是会被调用；回调函数接有两个参数，第一个参数`result`用于表示请求的结果，它可能是一个`AxiosResponse`，也可能是一个`AxiosError`，第二个参数`config`用于表示当前请求最终使用的配置信息
* `abort`：该方法用于取消请求

## API一览

Maxios提供了下列API：

* `globalConfig(axiosConfig, MaxiosConfig)`：该方法用于设置全局请求配置，第一个参数为传递给Axios的配置，第二个参数为传递给Maxios的配置
* `modulize(axiosConfig, maxiosConfig)`：该方法用于获取模块化的请求方法，第一个参数为传递给Axios的配置，第二个参数为传递给Maxios的配置，它会返回一个`request(axiosConfig, maxiosConfig)`方法
* `modulize().request(axiosConfig, maxiosConfig)`：`modulize()`返回的方法，该方法用于发起请求；它所接受的参数和`globalConfig()`、`modulize()`一样，第一个参数为传递给Axios的配置，第二个参数为传递给Maxios的配置；它会返回一个上文已经介绍过的链式调用对象
* `race(requests)`：该方法用于将多个请求以竞态的方式进行请求，以最先返回的请求的结果作为其结果；它接受一个由上文`request()`方法返回的链式对象组成的数组；同样它也返回了一个链式调用对象
* `all(requests)`：该方法用于同时发起多个请求，并以所有请求的结果作为其结果；它接受一个由上文`request()`方法返回的链式对象组成的数组；同样它也返回了一个链式调用对象

需要注意的是，如果希望获得完整的类型提示体验，在调用`request`方法时，需要为他的泛型指定具体类型。它接受三个泛型：

* `Payload`：请求的负载数据类型，也就是附加在请求的`body`中的数据的类型
* `OriginResult`：请求返回的原始结果的数据类型
* `FinalResult`：请求返回的结果，在被`extractor`提取后的数据类型（`extractor`会在后文详细讲解）

值得关注的是，所有接受`axiosConfig`和`maxiosConfig`参数的地方，同样也接受一个返回了配置对象的函数来作为参数。比如：

```ts
globalConfig(() => ({
  baseUrl: 'api',
  headers: {
    token: localStorage.getItem('auth-token')
  }
}))
```

当有一些配置需要每次请求时都动态获取时，使用函数化的配置是更好的选择。

## Axios配置合并策略

> `axiosConfig`请参考[Axios](https://axios-http.com)官网。

如上文所述，你可以通过不同的Maxios API，为同一个请求在不同的层级上配置和管理Axios。这也是Maxios的核心目的和功能。

Axios的配置项非常多，但在一般情况下Maxios遵守“层级越低，优先级越高”的策略来合并各层配置。具体来说，就是`request > modulize > globalConfig`。大部分处于Axios配置对象中的配置都会直接被高优先级的同名配置直接替换（replace）掉，但有一些特殊的配置，Maxios采用了不同的合并策略。

* `baseURL`：在不同层级配置的`baseURL`将会采用“Path Join”策略，高层级在前，低层级在后，比如在`global`中配置了`/api`，在`module`中配置了`/setting`，在`request`中配置了`/role`，则最终请求的`baseURL`为`/api/setting/role`
* `headers`：所有层级中配置的`headers`对象，在最终请求前都会通过类似`Object.assign`的方式合并为一个对象
* `params`：所有层级中配置的`headers`对象，在最终请求前都会通过类似`Object.assign`的方式合并为一个对象
* `data`：所有层级中配置的`data`对象，在最终请求前都会通过类似`Object.assign`的方式合并为一个对象；但需要注意的是，只要任意一个层级中配置的`data`不是简单对象，则最终请求就会以该配置为准

## Maxios常用配置一览

`globalConfig`、`modulize`和`request`的第二个参数`maxiosConfig`表示的是提供给Maxios的配置对象。Maxios支持下列常用配置：

* `requestError: AxiosError => void`：当请求发生错误时（无法获取到响应数据），你可能希望做一些处理（比如提示用户请求失败了），可以使用`requestError`配置一个回调函数进行处理；回调函数接受一个表示请求错误信息的`AxiosError`作为唯一参数；前文中的链式调用对象上也提供了同名的方法，其作用与此一致
* `expect: AxiosResponse => boolean`：用于判定请求返回的响应是否符合预期的回调函数，如果返回`false`，则认为响应不符合预期，Maxios会调用下文的`error()`配置的回调函数；如果返回`true`，则认为响应符合预期，则`sucess`配置的回调函数会被调用；回调函数接受一个表示响应信息的`AxiosResponse`作为唯一参数
* `error: OriginResult => void`：当请求返回了不符合预期的数据后，如果你需要处理这种情况，则可以使用`error`来配置一些回调函数进行处理；回调函数接受一个表示原始响应数据（从响应信息对象中获取到的）的`OriginResult`作为唯一参数；前文中的链式调用对象上也提供了同名的方法，其作用与此一致
* `extractor: OriginResult => FinalResult`：当请求返回的数据符合预期时，可能数据中最外层会有一些通用的结构，而`success`的处理逻辑可能并不关心这些通用的结构，这时你可以使用`extractor`来剥离外层结构提取业务数据；回调函数接受一个表示原始返回数据的`OriginResult`参数，它需要返回提取后的业务数据；默认的提取逻辑是直接提取原始响应数据
* `success: FinalResult => void`：当请求返回了符合预期的数据后，你的后续业务逻辑可以使用`success`来处理；前文中的链式调用对象上也提供了同名的方法，其作用与此一致
* `loading: Boolean => void`：该配置用于指示请求的loading状态；当请求的loading状态变化时，这个回调函数会被调用；回调函数接受一个表示当前是否正在loading的`boolean`作为唯一参数；前文中的链式调用对象上也提供了同名的方法，其作用与此一致
* `anyway: (AxiosResponse | AxiosError) => void`：无论请求的结果如何，该回调函数始终会在请求结束后被调用；回调函数接受一个唯一参数，用于表示响应信息或者响应错误信息；前文中的链式调用对象上也提供了同名的方法，其作用与此一致

### Maxios常用配置的优先级策略

下列配置遵守“层级越低，优先级越高”的策略，下级配置后，上级的同名配置不生效：

* `expect`
* `extractor`

下列配置所有层级都会生效，且执行顺序为从低到高；如果低层级的回调函数不希望上层的回调被继续执行，则可以通过返回`false`来打断后续高层级的回调函数执行
* `requestError`
* `error`
* `success`
* `loading`
* `anyway`

值得注意的是，对于这些所有层级都会执行的配置（回调函数），实际上有4个层级（最底层的层级是前文提到的链式调用对象），这些层级由高到低分别是

* `globalConfig`
* `modulize`
* `request`
* 链式调用对象

## 进阶配置

Maxios还提供了一些进阶配置。这些配置对应的功能通常并不常用，但一旦你有对应的需求，它将完美地帮助你干掉所有脏活累活。

## 重试请求

Maxios提供了请求重试的功能。你可以指定在一定条件下，对请求发起重试。这一功能在某些场景下特别有用，比如当你们开始使用双Token（Access Token / Refresh Token）机制来为用户认证提供无感续签功能时，Maxios的重试功能就能派上用场。

* `retryWhen`：请求的重试逻辑
  * `retryWhen.requestSuccess`：请求成功后的重试逻辑
    * `retryWhen.requestSuccess.beforeRetry?: () => Promise | void`：每次重试前需要执行的逻辑
    * `retryWhen.requestSuccess.condition?: AxiosResponse => boolean`：重试条件
    * `retryWhen.requestSuccess.retryOthers?: boolean | 'module' | 'global'`：重试时是否要取消并重试其它正在发起的请求
    * `retryWhen.requestSuccess.maximumCount?: number`：最大重试次数
  * `retryWhen.requestError`：该配置表示请求失败后的重试逻辑
    * `retryWhen.requestError.beforeRetry?: () => Promise | void`：每次重试前需要执行的逻辑
    * `retryWhen.requestError.condition?: AxiosError => boolean`：重试条件
    * `retryWhen.requestError.retryOthers?: boolean | 'module' | 'global'`：重试时是否要取消并重试其它正在发起的请求
    * `retryWhen.requestError.maximumCount?: number`：最大重试次数

### 结果缓存

Maxios提供了请求结果缓存的功能。如果一些请求返回的数据其更新频率极低且客户端各处的请求次数较多，则可以考虑使用结果缓存来降低真实的请求次数。请求结果缓存的相关配置如下：


* `cache`：请求结果的缓存逻辑
  * `cache.type`：指定使用的缓存类型，可以是`memory`，`session`（`window.sessionStoragy`）或者`local`（`window.localStoraty`）
  * `cache.key`：缓存的key，用于识别和获取缓存结果

### 自定义的请求方式

Maxios默认使用`axios.request()`来发起请求。某些情况下（比如你想为你的应用添加一些Ajax探针来收集Ajax请求的性能数据和错误信息）你可能希望自定义请求方式，你可以通过`maxiosConfig.request`这个配置来让Maxios使用你提供的请求方法发起请求。这个配置的类型签名如下：

```ts
type TRequest = <T = unknown, R = AxiosResponse<T>, D = any> (config: AxiosRequestConfig<D>) => Promise<R>
```

## TODO: 周边

Maxios还提供了基于React Hooks和Vue Composition两种风格的转换器，让你在实际业务中使用Maxios更为趁手。
