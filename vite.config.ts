import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: '[name].js', // background.js, content.js, sidepanel.js
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.html') {
            return 'sidepanel/[name].[ext]' // 出力先を dist/sidepanel に変更
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})