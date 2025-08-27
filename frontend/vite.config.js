import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'] // 包含.js文件
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 配置代码分割
    rollupOptions: {
      output: {
        // 手动配置代码分割
        manualChunks: {
          // React 相关库单独打包
          'react-vendor': ['react', 'react-dom'],
          // 图表库单独打包
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts'],
          // 日期处理库单独打包
          'date-vendor': ['date-fns', 'react-datepicker', 'react-calendar'],
          // 图标库单独打包
          'icons-vendor': ['react-icons'],
        },
        // 自定义 chunk 文件名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 调整 chunk 大小警告限制
    chunkSizeWarningLimit: 1000, // 1MB
    // 启用源码映射以便调试（可选）
    sourcemap: false
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
