import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageInfo from './package.json'

export default defineConfig({
  build: {
    outDir: 'lib',
    minify: false,
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      name: packageInfo.name,
      formats: ['es', 'umd', 'cjs'],
      fileName: 'maxios'
    }
  },
  plugins: [dts()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})