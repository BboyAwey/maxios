import { createApp } from 'vue'
import { mountReactDemo } from './react-demo'
import VueDemo from './vue-demo.vue'
import { setupGlobalConfig } from './api-definitions'

setupGlobalConfig()

function mount() {
  const reactEl = document.getElementById('react-demo-container')
  if (reactEl) {
    try {
      mountReactDemo(reactEl)
    } catch (e) {
      reactEl.innerHTML = `<div style="color:red;padding:20px"><h3>React Demo failed</h3><pre>${e}</pre></div>`
    }
  }

  const vueEl = document.getElementById('vue-demo-container')
  if (vueEl) {
    try {
      createApp(VueDemo).mount(vueEl)
    } catch (e) {
      vueEl.innerHTML = `<div style="color:red;padding:20px"><h3>Vue Demo failed</h3><pre>${e}</pre></div>`
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
