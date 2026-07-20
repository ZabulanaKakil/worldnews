import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project Pages URL: https://zabulanakakil.github.io/worldnews/
const repoBase = '/worldnews/'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? repoBase : '/',
}))
