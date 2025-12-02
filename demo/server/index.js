const Koa = require('koa')
const Router = require('@koa/router')
const koaBody = require('koa-body')

const app = new Koa()
const router = new Router({
  prefix: '/api'
})

router.get('/get-shit-2', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 5000)
  })
  ctx.body = {
    code: 0,
    msg: '',
    data: {
      shit: 1
    }
  }
  ctx.status = 200
  await next()
})

router.get('/get-shit', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
  ctx.body = {
    code: 0,
    msg: '',
    data: {
      shit: 1
    }
  }
  ctx.status = 200
  await next()
})


router.put('/put-shit', async (ctx, next) => {
  ctx.body = {
    code: 0,
    msg: '',
    data: ctx.request.body
  }
  ctx.status = 200
  await next()
})

router.post('/post-shit', async (ctx, next) => {
  ctx.body = {
    code: 0,
    msg: '',
    data: ctx.request.body
  }
  ctx.status = 200
  await next()
})

router.delete('/delete-shit', async (ctx, next) => {
  ctx.body = {
    code: 0,
    msg: '',
    data: ctx.request.query
  }
  ctx.status = 200
  await next()
})

router.get('/http-error-shit', async (ctx, next) => {
  ctx.status = 500
  ctx.body = 'shit happened'
})

router.get('/biz-error-shit', async (ctx, next) => {
  ctx.status = 200
  ctx.body = {
    code: 1,
    msg: 'shit happened',
    data: ctx.request.query
  }
})

// 支持参数查询的接口
router.get('/users', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: {
      users: [
        { id: 1, name: ctx.request.query.name || 'User 1', age: 20 },
        { id: 2, name: 'User 2', age: 25 }
      ],
      query: ctx.request.query
    }
  }
  ctx.status = 200
  await next()
})

// 支持缓存的接口（返回时间戳用于验证缓存）
router.get('/cached-data', async (ctx, next) => {
  ctx.body = {
    code: 0,
    msg: 'success',
    data: {
      timestamp: Date.now(),
      message: 'This data should be cached'
    }
  }
  ctx.status = 200
  await next()
})

// 支持重试的接口（前两次返回错误，第三次成功）
let retryCount = 0
router.get('/retry-test', async (ctx, next) => {
  retryCount++
  if (retryCount < 3) {
    ctx.status = 500
    ctx.body = { error: 'Retry needed', attempt: retryCount }
  } else {
    retryCount = 0 // Reset for next test
    ctx.status = 200
    ctx.body = {
      code: 0,
      msg: 'success',
      data: {
        message: 'Success after retries',
        attempts: 3
      }
    }
  }
  await next()
})

// 支持重试的业务错误接口（返回 code !== 0）
let bizRetryCount = 0
router.get('/biz-retry-test', async (ctx, next) => {
  bizRetryCount++
  if (bizRetryCount < 3) {
    ctx.status = 200
    ctx.body = {
      code: 1,
      msg: 'Business error, retry needed',
      data: { attempt: bizRetryCount }
    }
  } else {
    bizRetryCount = 0 // Reset for next test
    ctx.status = 200
    ctx.body = {
      code: 0,
      msg: 'success',
      data: {
        message: 'Success after business retries',
        attempts: 3
      }
    }
  }
  await next()
})

// 延迟响应接口（用于测试 race）
router.get('/slow-request', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 3000)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: { message: 'Slow response', delay: 3000 }
  }
  ctx.status = 200
  await next()
})

// 快速响应接口（用于测试 race）
router.get('/fast-request', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 500)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: { message: 'Fast response', delay: 500 }
  }
  ctx.status = 200
  await next()
})

// 多个并发请求接口
router.get('/request-1', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: { id: 1, message: 'Request 1 completed' }
  }
  ctx.status = 200
  await next()
})

router.get('/request-2', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 1500)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: { id: 2, message: 'Request 2 completed' }
  }
  ctx.status = 200
  await next()
})

router.get('/request-3', async (ctx, next) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 2000)
  })
  ctx.body = {
    code: 0,
    msg: 'success',
    data: { id: 3, message: 'Request 3 completed' }
  }
  ctx.status = 200
  await next()
})

const PORT = 3000
app.use(koaBody())
app.use(router.routes())

app.listen(PORT)
console.log('Demo server now running on port ' + PORT)
