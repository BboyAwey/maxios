import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageInfo from './package.json'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  
  if (isDev) {
    // 开发模式：支持 demo
    return {
      server: {
        proxy: {
          '/api': 'http://localhost:3000'
        }
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src')
        }
      }
    }
  }
  
  // 构建模式：构建库
  return {
    build: {
      outDir: 'lib',
      minify: false,
      lib: {
        entry: {
          index: resolve(__dirname, './src/index.ts'),
          react: resolve(__dirname, './src/react.ts'),
          vue: resolve(__dirname, './src/vue.ts')
        },
        name: packageInfo.name,
        formats: ['es', 'cjs'],
        fileName: (format, entryName) => {
          if (format === 'es') {
            return `${entryName}.js`
          }
          return `${entryName}.${format}.js`
        }
      },
      rollupOptions: {
        external: [
          ...Object.keys(packageInfo.dependencies || []),
          'react',
          'vue'
        ],
        output: {
          globals: {
            '@awey/dache': 'Dache',
            'axios': 'Axios',
            'react': 'React',
            'vue': 'Vue'
          }
        }
      }
    },
    plugins: [
      dts({
        entryRoot: './src',
        include: ['./src/**/*.ts'],
        exclude: ['./src/**/*.test.ts']
      })
    ]
  }
})