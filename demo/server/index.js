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

const PORT = 3000
app.use(koaBody())
app.use(router.routes())

app.listen(PORT)
console.log('Demo server now running on port ' + PORT)
