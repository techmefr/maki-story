import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { offlineManifestAssets, offlineShellAssets } from '../shared/utils/offlineShell.ts'

const directory = new URL('../.output/public/', import.meta.url)
const candidates = ['../node_modules/.cache/nuxt/.nuxt/dist/server/client.manifest.mjs', '../.nuxt/dist/server/client.manifest.mjs']
const manifestUrl = candidates.map(path => new URL(path, import.meta.url)).find(path => existsSync(path))
if (!manifestUrl) {
    throw new Error('Production client manifest is missing')
}
const { default: manifest } = await import(manifestUrl.href)
const index = new URL('index.html', directory)
const html = existsSync(index) ? readFileSync(index, 'utf8') : ''
const assets = [...new Set([...offlineShellAssets(html), ...offlineManifestAssets(manifest)])].filter(path => existsSync(new URL(`.${path}`, directory)))
const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')
const version = createHash('sha256').update(JSON.stringify(assets)).update(html).update(source).digest('hex').slice(0, 16)
const worker = source.replace("const CACHE_NAME = 'tantara-v4'", `const CACHE_NAME = 'tantara-${version}'`).replace('const SHELL_ASSETS = []', `const SHELL_ASSETS = ${JSON.stringify(assets)}`)
writeFileSync(new URL('sw.js', directory), worker)
