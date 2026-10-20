import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

for (const mode of ['node', 'vercel', 'explicit-vercel']) {
    test(`offline preparation writes the deployed worker for ${mode}, preserving stale alternate output`, () => {
        const root = mkdtempSync(join(tmpdir(), 'maki-offline-'))
        const put = (path: string, content: string): void => {
            const target = join(root, path)
            mkdirSync(join(target, '..'), { recursive: true })
            writeFileSync(target, content)
        }
        try {
            put('package.json', '{"type":"module"}')
            for (const path of ['scripts/prepare-offline.ts', 'shared/utils/offlineShell.ts', 'public/sw.js']) {
                put(path, '')
                copyFileSync(new URL(`../../${path}`, import.meta.url), join(root, path))
            }
            put('node_modules/.cache/nuxt/.nuxt/dist/server/client.manifest.mjs', 'export default { entry: { file: "entry.js", isEntry: true } }')
            const output = mode === 'node' ? '.output/public' : '.vercel/output/static'
            const other = mode === 'node' ? '.vercel/output/static' : '.output/public'
            put(`${output}/_nuxt/entry.js`, 'deployed asset')
            put(`${output}/sw.js`, 'unprepared worker')
            if (mode === 'node') put('.output/server/index.mjs', 'export const assets = {"/sw.js": {"size": 18, "etag": "stale", "mtime": "old", "path": "../public/sw.js"}}')
            put(`${other}/sw.js`, 'stale output must stay unchanged')
            const env = { ...process.env }
            delete env.NITRO_PRESET
            delete env.VERCEL
            if (mode === 'vercel') env.VERCEL = '1'
            if (mode === 'explicit-vercel') env.NITRO_PRESET = 'vercel'
            execFileSync(process.execPath, ['--experimental-strip-types', join(root, 'scripts/prepare-offline.ts')], { env })
            const worker = readFileSync(join(root, output, 'sw.js'), 'utf8')
            if (mode === 'node') {
                const server = readFileSync(join(root, '.output/server/index.mjs'), 'utf8')
                assert.ok(server.includes(`"size":${Buffer.byteLength(worker)}`))
                assert.ok(!server.includes('"etag":"stale"'))
            }
            assert.match(worker, /const CACHE_NAME = 'tantara-[a-f0-9]{16}'/)
            assert.ok(worker.includes('const SHELL_ASSETS = ["/_nuxt/entry.js"]'))
            assert.equal(readFileSync(join(root, other, 'sw.js'), 'utf8'), 'stale output must stay unchanged')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
}
