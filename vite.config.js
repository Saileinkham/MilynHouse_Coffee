import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GITHUB_REPO = process.env.GITHUB_REPOSITORY
const REPO_BASE = GITHUB_REPO ? `/${GITHUB_REPO.split('/')[1]}/` : '/'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? REPO_BASE : '/',
})
