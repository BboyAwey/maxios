const Koa = require('koa')
const Router = require('@koa/router')
const koaBody = require('koa-body')

const app = new Koa()
const router = new Router({ prefix: '/api' })

// ========== User CRUD ==========

router.get('/users', async (ctx, next) => {
  await delay(500)
  ctx.body = success({
    users: [
      { id: 1, name: ctx.request.query.name || 'Alice', age: 28 },
      { id: 2, name: 'Bob', age: 32 }
    ],
    query: ctx.request.query
  })
  await next()
})

router.get('/users/search', async (ctx, next) => {
  await delay(500)
  ctx.body = success({
    users: [
      { id: 1, name: 'Search Result 1', age: 20 },
      { id: 2, name: 'Search Result 2', age: 25 }
    ],
    page: parseInt(ctx.request.query.page) || 1,
    query: ctx.request.query.query || ''
  })
  await next()
})

router.get('/users/:id', async (ctx, next) => {
  await delay(500)
  const id = parseInt(ctx.params.id)
  ctx.body = success({
    id,
    name: ctx.request.query.name || `User ${id}`,
    age: 20 + id
  })
  await next()
})

router.post('/users', async (ctx, next) => {
  ctx.body = success({ id: Date.now(), ...ctx.request.body })
  await next()
})

router.put('/users/:id', async (ctx, next) => {
  ctx.body = success({ id: parseInt(ctx.params.id), ...ctx.request.body })
  await next()
})

router.delete('/users/:id', async (ctx, next) => {
  ctx.body = success({ id: parseInt(ctx.params.id) })
  await next()
})

// ========== Error endpoints ==========

router.get('/error/http', async (ctx, next) => {
  ctx.status = 500
  ctx.body = 'Internal Server Error'
  await next()
})

router.get('/error/business', async (ctx, next) => {
  ctx.body = { code: 1, msg: 'Business logic failed', data: null }
  await next()
})

// ========== Cache test ==========

router.get('/cached-data', async (ctx, next) => {
  ctx.body = success({ timestamp: Date.now(), message: 'This data should be cached' })
  await next()
})

// ========== Retry test ==========

let retryCount = 0
router.get('/retry-test', async (ctx, next) => {
  retryCount++
  if (retryCount < 3) {
    ctx.status = 500
    ctx.body = { error: 'Retry needed', attempt: retryCount }
  } else {
    retryCount = 0
    ctx.body = success({ message: 'Success after retries', attempts: 3 })
  }
  await next()
})

let bizRetryCount = 0
router.get('/biz-retry-test', async (ctx, next) => {
  bizRetryCount++
  if (bizRetryCount < 3) {
    ctx.body = { code: 1, msg: 'Business error, retry needed', data: { attempt: bizRetryCount } }
  } else {
    bizRetryCount = 0
    ctx.body = success({ message: 'Success after business retries', attempts: 3 })
  }
  await next()
})

// ========== Race / All test ==========

router.get('/slow-request', async (ctx, next) => {
  await delay(3000)
  ctx.body = success({ message: 'Slow response', delay: 3000 })
  await next()
})

router.get('/fast-request', async (ctx, next) => {
  await delay(500)
  ctx.body = success({ message: 'Fast response', delay: 500 })
  await next()
})

router.get('/request/:id', async (ctx, next) => {
  const id = parseInt(ctx.params.id)
  await delay(500 * id)
  ctx.body = success({ id, message: `Request ${id} completed` })
  await next()
})

// ========== Helpers ==========

function success(data) {
  return { code: 0, msg: 'success', data }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ========== Start ==========

const PORT = 3000
app.use(koaBody())
app.use(router.routes())
app.listen(PORT)
console.log(`Demo server running at http://localhost:${PORT}`)
