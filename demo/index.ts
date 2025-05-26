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
      return response.data.code === 0
    },
    extractor (response) {
      return response.data.data
    },
    loading: status => console.log('global loading...', status),
    error: (data) => console.log('global error...', data),
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
      data: [{ shit: number }]
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
      url: '/get-shit-2',
    })
  },
  postShit () {
    return request({
      url: '/post-shit',
      method: 'POST',
      data: [{a: 1}, {a: 2}]
    })
  },
  getBizErr () {
    return request({
      url: '/biz-error-shit'
    })
  }
}

function sendRequest () {
  // apis.getShit2()
  // apis.getShit()
  // apis.getShit2()
  apis.postShit()
}

function sendRequest2 () {
  apis.getShit2()
    .loading(res => console.log('loading 1...', res))
    .loading(res => console.log('loading 2...', res))
    .loading(res => console.log('loading 3...', res))
}

function sendRequest3 () {
  apis.getShit()
    .success(() => {
      console.log('get shit success')
      throw new Error('shit')
    })
}

function sendRequest4 () {
  apis.getBizErr()
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

  const button3 = document.createElement('button')
  button3.innerText = '发送请求3'
  button3.addEventListener('click', sendRequest3)
  document.body.appendChild(button3)

  const button4 = document.createElement('button')
  button4.innerText = '发送请求4'
  button4.addEventListener('click', sendRequest4)
  document.body.appendChild(button4) 
})

