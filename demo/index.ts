// import { AxiosResponse } from 'axios'
import { globalConfig, modulize } from '../src'

interface Response<T> {
  code: number
  data?: T
  msg: string
}

// globalConfig({
//   baseURL: 'http://localhost:3000'
// })

// let num = 0

// setInterval(() => {
//   num = Math.round(Math.random() * 1000)
// }, 1000)

globalConfig<Response<unknown>>(
  {
    baseURL: '/api',
    headers: {
      'XXXX-GLOBAL': 'header from global'
    }
  },
  {
    expect (response) {
      return response.data.code === 1
    },
    extractor (response) {
      return response.data.data
    },
    loading: status => console.log('global loading...', status)
  }
)

const request = modulize(
  () => ({
    headers: {
      'XXXX-MODULE': 'header from module'
    }
  }),
  {
    loading: status => console.log('module loading...', status)
  }
)
const apis = {
  getShit () {
    return request<void, {
      code: number
      msg: string
      data: { shit: number }
    }>({
      url: '/get-shit'
    }, {
      retryWhen: {
        requestSuccess: {
          beforeRetry: () => {
            console.log('before retry in request definition')
            // return Promise.resolve()
          },
          retryOthers: 'module',
          maximumCount: 4,
          condition: (res) => {
            console.log(res, '000000')
            return res.data.code === 0
          }
        }
      },
      loading: status => console.log('loading...', status)
    })
  },
  getShit2 () {
    return request({
      url: '/get-shit-2'
    })
  }
}

function sendRequest () {
  apis.getShit2()
  apis.getShit()
  apis.getShit2()
}

function sendRequest2 () {
  apis.getShit2()
    .loading(res => console.log('loading 1...', res))
    .loading(res => console.log('loading 2...', res))
    .loading(res => console.log('loading 3...', res))
}

window.addEventListener('load', () => {
  const button = document.createElement('button')
  button.innerText = '发送请求'
  button.addEventListener('click', sendRequest)

  document.body.appendChild(button)

  const button2 = document.createElement('button')
  button2.innerText = '发送请求2'
  button2.addEventListener('click', sendRequest2)

  document.body.appendChild(button2)
  
})


