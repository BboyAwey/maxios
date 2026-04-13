import { race, all } from '../src'
import { setupGlobalConfig, userApi, miscApi } from './api-definitions'

setupGlobalConfig()

// ========== Log helpers ==========

function log(msg: string) {
  const el = document.getElementById('log')
  if (!el) return
  const entry = document.createElement('div')
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`
  entry.style.cssText = 'padding:4px;border-bottom:1px solid #eee'
  el.appendChild(entry)
  el.scrollTop = el.scrollHeight
}

function clearLog() {
  const el = document.getElementById('log')
  if (el) el.innerHTML = ''
}

// ========== Test functions ==========

function testChainedCalls() {
  clearLog()
  log('=== Chained Calls ===')
  userApi.getAll({ name: 'Alice' })
    .loading(s => log(`Loading: ${s}`))
    .success(d => log(`Success: ${JSON.stringify(d)}`))
    .error(d => log(`Biz Error: ${JSON.stringify(d)}`))
    .requestError(e => log(`Request Error: ${e.message}`))
    .anyway(() => log('Anyway called'))
}

function testAbort() {
  clearLog()
  log('=== Abort ===')
  const chain = userApi.getAll()
    .loading(s => log(`Loading: ${s}`))
    .success(d => log(`Success: ${JSON.stringify(d)}`))
  log('Aborting in 100ms...')
  setTimeout(() => { chain.abort(); log('Aborted') }, 100)
}

function testCache() {
  clearLog()
  log('=== Cache ===')
  const fetch = () => {
    const t = Date.now()
    miscApi.cachedData().success(d => log(`Got data in ${Date.now() - t}ms: ${JSON.stringify(d)}`))
  }
  log('1st request (network)...')
  fetch()
  setTimeout(() => { log('2nd request (should be cached)...'); fetch() }, 1000)
}

function testRetry() {
  clearLog()
  log('=== Retry ===')
  miscApi.retryTest()
    .loading(s => log(`Loading: ${s}`))
    .success(d => log(`Success: ${JSON.stringify(d)}`))
    .requestError(e => log(`Error: ${e.message}`))
}

function testRace() {
  clearLog()
  log('=== Race ===')
  race([miscApi.slowRequest(), miscApi.fastRequest()])
    .loading(s => log(`Loading: ${s}`))
    .success(d => log(`Winner: ${JSON.stringify(d)}`))
}

function testAll() {
  clearLog()
  log('=== All ===')
  all([miscApi.getRequest(1), miscApi.getRequest(2), miscApi.getRequest(3)])
    .loading(s => log(`Loading: ${s}`))
    .success(d => log(`All done: ${JSON.stringify(d)}`))
}

function testErrors() {
  clearLog()
  log('=== Error Handling ===')
  log('HTTP 500...')
  miscApi.httpError()
    .requestError(e => log(`HTTP Error: ${e.message}`))
    .anyway(() => log('HTTP anyway'))
  setTimeout(() => {
    log('Business error...')
    miscApi.bizError()
      .error(d => log(`Biz Error: ${JSON.stringify(d)}`))
      .anyway(() => log('Biz anyway'))
  }, 1000)
}

// ========== Mount UI ==========

window.addEventListener('load', () => {
  const app = document.getElementById('app')
  if (!app) return

  app.innerHTML = `
    <div style="max-width:1000px;margin:0 auto;padding:20px;font-family:system-ui,sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h1 style="margin:0">Maxios Demo</h1>
        <a href="/demo/hooks-test.html"
           style="padding:8px 16px;background:#667eea;color:#fff;text-decoration:none;border-radius:6px;font-weight:500">
          Hooks Demo →
        </a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div>
          <h2>Core Features</h2>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button id="btn-chain" style="padding:10px;cursor:pointer">Chained Calls</button>
            <button id="btn-abort" style="padding:10px;cursor:pointer">Abort Request</button>
            <button id="btn-cache" style="padding:10px;cursor:pointer">Result Caching</button>
            <button id="btn-retry" style="padding:10px;cursor:pointer">Auto Retry</button>
            <button id="btn-race" style="padding:10px;cursor:pointer">Race</button>
            <button id="btn-all" style="padding:10px;cursor:pointer">All</button>
            <button id="btn-errors" style="padding:10px;cursor:pointer">Error Handling</button>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h2>Log</h2>
            <button id="btn-clear" style="padding:4px 12px;cursor:pointer">Clear</button>
          </div>
          <div id="log" style="height:400px;overflow-y:auto;border:1px solid #ddd;padding:10px;background:#f9f9f9;font-family:monospace;font-size:12px"></div>
        </div>
      </div>
    </div>
  `

  document.getElementById('btn-chain')!.onclick = testChainedCalls
  document.getElementById('btn-abort')!.onclick = testAbort
  document.getElementById('btn-cache')!.onclick = testCache
  document.getElementById('btn-retry')!.onclick = testRetry
  document.getElementById('btn-race')!.onclick = testRace
  document.getElementById('btn-all')!.onclick = testAll
  document.getElementById('btn-errors')!.onclick = testErrors
  document.getElementById('btn-clear')!.onclick = clearLog
})
