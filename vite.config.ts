import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 自建标准 Vite 配置（替代原 @lark-apaas/coding-preset-vite-react 的 defineConfig）
export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  define: {
    // 兼容 client 代码中的 process.env.CLIENT_BASE_PATH（独立部署固定为根路径）
    'process.env.CLIENT_BASE_PATH': JSON.stringify('/'),
  },
});
