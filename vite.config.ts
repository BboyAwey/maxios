import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageInfo from './package.json'

export default defineConfig({
  build: {
    outDir: 'lib',
    minify: false,
    lib: {
      entry: resolve(__dirname, './maxios/maxios.ts'),
      name: packageInfo.name,
      formats: ['es', 'umd', 'cjs'],
      fileName: 'maxios'
    }
  },
  plugins: [
    dts({
      entryRoot: resolve(__dirname, './maxios')
    })
  ]
})