// import { AxiosResponse } from 'axios'
import { all, global, modulize, race } from '../maxios'

interface Response<T> {
  code: number
  data?: T
  msg: string
}

global({
  axiosConfig: {
    baseURL: 'http://localhost:3000'
  }
})

let num = 0

setInterval(() => {
  num = Math.round(Math.random() * 1000)
}, 1000)

global<Response<unknown>>({
  axiosConfig: {
    baseURL: '/api',
    headers: {
      XXXXGLOBAL: num + ''
    }
  },
  indicator (response) {
    return response.data.code !== 1
  },
  extractor (response) {
    return response.data.data
  },
  bizError (data) {
    console.log(data, '---biz error from global')
  },
  error (err) {
    console.log(err)
  },
  success () {
    console.log('success from global')
  },
  anyway () {
    console.log('anyway from global')
  }
})

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

const request = modulize(() => ({
  axiosConfig: {
    headers: {
      XXXXMODULE: num + ''
    }
  },
  bizError (data: any) {
    console.log(data, '--biz error from module')
    return true
  },
  success () {
    console.log('success from module')
  },
  anyway () {
    console.log('anyway from module')
  }
  // indicator (response) {
  //   return response.data.code === 0
  // }
  // request (config: AxiosRequestConfig) {
  //   // return axios.request(config)
  //   return new Promise((resolve, reject) => {
  //     let count = 3

  //     const timer = setInterval(() => {
  //       console.log('---' + count + '---' + new Date().getTime())
  //       count--

  //       if (count === 0) {
  //         if (count) return
  //         const flag = Math.random()
  //         if (flag < 0.5) {
  //           reject(new Error('fuck me'))
  //         } else {
  //           resolve(axios.request(config))
  //         }
  //         clearInterval(timer)
  //       }
  //     }, 3000)
  //   })
  // }
}))

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
      axiosConfig: {
        url: '/get-shit'
      },
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
      axiosConfig: {
        url: '/biz-error-shit',
        params: query,
        headers: {
          XXXXAPI: num + ''
        }
      },
      bizError (data) {
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
      axiosConfig: {
        url: '/biz-error-shit',
        params: query
      },
      bizError (data) {
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

function sendRequest () {
  // errorApis.getBizError({ a: 1 }).bizError((data) => {
  //   console.log(data, '--biz error from request')
  //   return true
  // }).error(err => {
  //   console.log(err, '--http err from request')
  //   return true
  // })
  // apis.getShit()
  //   .success(() => {
  //     console.log('success from request')
  //   })
  //   .anyway(() => {
  //     console.log('anyway from request')
  //   })
  // errorApis.getBizError({ a: 2 })

  race<{ shit: 1 }>([
    apis.getShit(),
    apis.getShit()
  ])
    .anyway(() => {
      console.log('---race anyway')
    })
    .success((res) => {
      console.log('---race success', res)
    })
    .error(err => {
      console.log('---race err', err)
    })
    .bizError(err => {
      console.log('---race biz err', err)
    })
  
  all<{ shit: number }>([
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
    .error(err => {
      console.log('---all err', err)
    })
    .bizError(err => {
      console.log('---all biz err', err)
    })
}

window.addEventListener('load', () => {
  const button = document.createElement('button')
  button.innerText = '发送请求'
  button.addEventListener('click', sendRequest)

  document.body.appendChild(button)
})


