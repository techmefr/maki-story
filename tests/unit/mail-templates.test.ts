import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderMail } from '../../technical/Mail/server/utils/mailTemplates.ts'
import type { MailTemplateId } from '../../technical/Mail/server/utils/mailTemplates.ts'

type Tree = { [key: string]: string | Tree }
const templates: MailTemplateId[] = ['magic_link', 'invitation', 'code_reset', 'welcome', 'review_request', 'corrections', 'new_voice', 'export_ready', 'account_deleted', 'digest']
const site = { baseUrl: 'https://maki.example', address: '', support: '' }

for (const lang of ['fr', 'en']) {
    const catalog: Tree = JSON.parse(readFileSync(new URL(`../../technical/Mail/server/i18n/${lang}.json`, import.meta.url), 'utf8'))
    const translate = (key: string, params: Record<string, string | number> = {}): string => {
        let value: string | Tree = catalog
        for (const part of key.split('.')) {
            value = typeof value === 'object' ? value[part] ?? key : key
        }
        return typeof value === 'string' ? value.replace(/\{(\w+)\}/g, (_match, name: string) => String(params[name] ?? '')) : key
    }
    for (const template of templates) {
        test(`${lang}: ${template} renders branded HTML and plain text without exposing markup`, () => {
            const rendered = renderMail({ template, params: { name: '<script>bad</script>', family: 'Family', role: 'parent', code: '1234', hours: 24, minutes: 15, book: 'Book', parent: 'Parent', count: 3, n: 2, child: 'Child', days: 7, comment: 'Again', url: 'https://maki.example/home' } }, translate, site, lang)
            assert.ok(rendered.subject)
            assert.ok(rendered.text)
            assert.match(rendered.html, /Maki Story/)
            assert.doesNotMatch(rendered.html, /<script>/)
            assert.doesNotMatch(rendered.html, /tpl\.[a-z_]+\./)
            assert.doesNotMatch(rendered.html, /\{[a-zA-Z]+\}/)
            if (template === 'digest') {
                assert.match(rendered.html, /https:\/\/maki\.example\/notifications\/settings/)
            }
        })
    }
}
