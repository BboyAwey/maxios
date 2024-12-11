// import { AxiosResponse } from 'axios'
import { all, globalConfig, modulize, race, toPromise } from '../src'

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
    isError (response) {
      return response.data.code !== 1
    },
    extractor (response) {
      return response.data.data
    },
  }
)

const request = modulize(
  () => ({
    headers: {
      'XXXX-MODULE': 'header from module'
    }
  })
)
const apis = {
  getShit () {
    return request({
      url: '/get-shit'
    }, {
      retryWhen: {
        error: {
          beforeRetry: () => {
            console.log('before retry')
            return Promise.resolve()
          },
          retryOthers: 'module',
          maximumCount: 4
        }
      }
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
}

window.addEventListener('load', () => {
  const button = document.createElement('button')
  button.innerText = '发送请求'
  button.addEventListener('click', sendRequest)

  document.body.appendChild(button)
})


