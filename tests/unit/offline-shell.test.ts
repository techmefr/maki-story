import assert from 'node:assert/strict'
import { test } from 'node:test'
import { offlineManifestAssets, offlineShellAssets } from '../../shared/utils/offlineShell.ts'

test('offline shell preloads only local code and fonts, without API responses or external resources', () => {
    const assets = offlineShellAssets(`<script src="/_nuxt/entry.js"></script><link href="/_nuxt/entry.css"><link href="/fonts/title.woff2"><script src="/_nuxt/entry.js"></script><img src="https://external.invalid/x"><a href="/api/files/private">private</a>`)
    assert.deepEqual(assets, ['/_nuxt/entry.js', '/_nuxt/entry.css', '/fonts/title.woff2'])
})

test('offline manifest includes reading dependencies and handles import cycles without preloading the whole app', () => {
    const assets = offlineManifestAssets({
        entry: { file: 'entry.js', isEntry: true, imports: ['shared'], css: ['entry.css'] },
        shared: { file: 'shared.js', imports: ['entry'] },
        'pages/kid/listen/[id].vue': { file: 'reader.js', imports: ['voice'] },
        voice: { file: 'voice.js' },
        studio: { file: 'large-studio.js' },
    })
    assert.deepEqual(assets, ['/_nuxt/entry.css', '/_nuxt/entry.js', '/_nuxt/reader.js', '/_nuxt/shared.js', '/_nuxt/voice.js'])
})
