// import { AxiosResponse } from 'axios'
import { all, global, modulize, race, toPromise } from '../src'

interface Response<T> {
  code: number
  data?: T
  msg: string
}

global({
  baseURL: 'http://localhost:3000'
})

let num = 0

setInterval(() => {
  num = Math.round(Math.random() * 1000)
}, 1000)

global<Response<unknown>>(
  {
    baseURL: '/api',
    headers: {
      XXXXGLOBAL: num + ''
    }
  },
  {
    indicator (response) {
      return response.data.code !== 1
    },
    extractor (response) {
      return response.data.data
    },
    error (data) {
      console.log(data, '---biz error from global')
    },
    statusError (err) {
      console.log(err)
    },
    success () {
      console.log('success from global')
    },
    anyway () {
      console.log('anyway from global')
    }
  }
)

// const getShitRequest = modulize()

// const getShit = () => {
//   getShitRequest({
//     axiosConfig: {
//       url: 'get-shit'
//     },
//     cache: {
//       type: 'memory',
//       key: 'shit'
//     }
//   }).success(res => {
//     console.log(res)
//   })
// }

// setInterval(() => {
//   getShit()
// }, 2000)
const request = modulize(
  () => ({
    headers: {
      XXXX_MODULE: num + ''
    }
  }),
  () => ({
    statusError (error) {
      console.log('module error', error)
    },
    error (data: any) {
      console.log(data, '--biz error from module')
      return true
    },
    success () {
      console.log('success from module')
    },
    anyway () {
      console.log('anyway from module')
    }
  })
)

// request<{ a: number }, string>({
//   axiosConfig: {
//     url: '/biz-error-shit',
//     params: { a: 1 }
//   },
//   bizError (data) {
//     console.log(data, '--biz error from api')
//     return true
//   },
//   beforeSend (axiosConfig) {
//     console.log(axiosConfig.params, '--before send form api')
//     return axiosConfig
//   }
// })
const apis = {
  getShit () {
    return request({
      url: '/get-shit'
    }, {
      success () {
        console.log('success from api')
      },
      anyway () {
        console.log('anyway from api')
      }
    })
  }
}

const errorApis = {
  getBizError (query: { a: number }) {
    return request<{ a: number }, string>({
      url: '/biz-error-shit',
      params: query,
      headers: {
        XXXXAPI: num + ''
      }
    }, {
      error (data) {
        console.log(data, '--biz error from api')
        return true
      },
      cache: {
        key: 'biz_error',
        type: 'memory'
      }
    })
  },
  getBizError2 (query: { a: number }) {
    return request<{ a: number }, string>({
      url: '/biz-error-shit',
      params: query
    }, {
      error (data) {
        console.log(data, '--biz error from api')
        return true
      }
    })
  }
  // getShit (query: { a: number }) {
  //   return waterfall([
  //     errorApis.getBizError(query),
  //     errorApis.getBizError2(query)
  //   ])
  // }
}

const getError = () => {
  return request<void, { code: number, msg: string, data: { a: 1 } }, { a: 1 }>({
    url: '/error'
  }, {
    statusError (error) {
      console.log('request error', error)
      return true
    }
  })
}

function sendRequest () {
  // errorApis.getBizError({ a: 1 }).bizError((data) => {
  //   console.log(data, '--biz error from request')
  //   return true
  // }).error(err => {
  //   console.log(err, '--http err from request')
  //   return true
  // })
  // apis.getShit()
  //   .loading((status) => {
  //     console.log(status, '---loading from request')
  //   })
  //   .success(() => {
  //     console.log('success from request')
  //   })
  //   .anyway(() => {
  //     console.log('anyway from request')
  //   })
  // errorApis.getBizError({ a: 2 })

  race<{ shit: 1 }>([
    apis.getShit(),
    apis.getShit(),
    errorApis.getBizError({ a: 2 })
  ])
    .anyway(() => {
      console.log('---race anyway')
    })
    .success((res) => {
      console.log('---race success', res)
    })
    .statusError(err => {
      console.log('---race err', err)
    })
    .error(err => {
      console.log('---race biz err', err)
    })
    .loading(loading => {
      console.log('---race loading', loading)
    })
  
  all<[{ shit: number }, { shit: 1 }]>([
    apis.getShit(),
    apis.getShit(),
    // errorApis.getBizError({ a: 2 })
  ])
    .anyway(() => {
      console.log('---all anyway')
    })
    .success((res) => {
      console.log('---all success', res)
    })
    .statusError(err => {
      console.log('---all err', err)
    })
    .error(err => {
      console.log('---all biz err', err)
    })
    .loading(loading => {
      console.log('---all loading', loading)
    })
  
  toPromise(getError())
    .then(res => console.log('to promise res', res))
    .catch(error => console.log('to promise error: ', error))
}

window.addEventListener('load', () => {
  const button = document.createElement('button')
  button.innerText = '发送请求'
  button.addEventListener('click', sendRequest)

  document.body.appendChild(button)
})


