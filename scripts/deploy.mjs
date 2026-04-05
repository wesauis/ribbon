#!/usr/bin/env node
/**
 * Deploy manual para GitHub Pages: build com base do repositório e push de `dist` para o ramo `gh-pages`.
 *
 * Uso:
 *   npm run deploy
 *   npm run deploy -- meu-repo
 *   GITHUB_REPOSITORY=org/meurepo npm run deploy
 *
 * O nome do repositório define VITE_BASE=/nome/ (obrigatório para o site em user.github.io/nome/).
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
