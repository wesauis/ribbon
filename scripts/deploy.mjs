#!/usr/bin/env node
/**
 * Manual GitHub Pages deploy: build with repo base path and push `dist` to `gh-pages`.
 *
 * Usage:
 *   npm run deploy
 *   npm run deploy -- my-repo
 *   GITHUB_REPOSITORY=org/myrepo npm run deploy
 *
 * The repo name sets `VITE_BASE=/name/` (required for `user.github.io/name/` project pages).
 */
import { execSync } from 'node:child_process'
import process from 'node:process'

const arg = process.argv[2]
const fromEnv = process.env.GITHUB_REPOSITORY?.split('/')[1]
const repo = arg || fromEnv || 'ribbon'
const base = `/${repo.replace(/^\/|\/$/g, '')}/`

const env = { ...process.env, VITE_BASE: base }

console.info(`[deploy] VITE_BASE=${base}`)

execSync('npm run build', { stdio: 'inherit', env })
execSync('npx gh-pages -d dist', { stdio: 'inherit', env })
