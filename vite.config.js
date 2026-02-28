import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'emoji-picker-react',
      'react-is',
    ],
  },
  resolve: {
    alias: {
      'react-is': 'react-is/cjs/react-is.development.js',
      // Force recharts v3 to use its proper ESM build to avoid
      // Rollup "SCALE_TYPES" binding error
      'recharts': path.resolve('./node_modules/recharts/es6/index.js'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
    },
  },
})
