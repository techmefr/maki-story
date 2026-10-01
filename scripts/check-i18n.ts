import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'i18n', 'locales')
const SOURCE = 'fr'
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other']

const flatten = (tree: Record<string, unknown>, prefix: string, out: Map<string, string>): void => {
    for (const [key, value] of Object.entries(tree)) {
        const path = `${prefix}.${key}`
        if (typeof value === 'string') {
            out.set(path, value)
        } else if (value && typeof value === 'object') {
            const entries = Object.keys(value)
            if (entries.length > 0 && entries.every(entry => PLURAL_CATEGORIES.includes(entry))) {
                out.set(path, (value as Record<string, string>).other ?? '')
            } else {
                flatten(value as Record<string, unknown>, path, out)
            }
        }
    }
}

const load = (locale: string): Map<string, string> => {
    const out = new Map<string, string>()
    const dir = join(ROOT, locale)
    if (!existsSync(dir)) {
        return out
    }
    for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
        flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')), file.replace(/\.json$/, ''), out)
    }
    return out
}

const placeholders = (text: string): string => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',')

const source = load(SOURCE)
const locales = readdirSync(ROOT).filter(name => name !== SOURCE)
const problems: string[] = []

for (const locale of locales) {
    const messages = load(locale)
    for (const [key, text] of source) {
        const translated = messages.get(key)
        if (translated === undefined || translated.trim() === '') {
            problems.push(`${locale}: missing ${key}`)
        } else if (placeholders(translated) !== placeholders(text)) {
            problems.push(`${locale}: placeholders differ for ${key}`)
        }
    }
    for (const key of messages.keys()) {
        if (!source.has(key)) {
            problems.push(`${locale}: unknown key ${key}`)
        }
    }
}

if (problems.length > 0) {
    console.error(problems.join('\n'))
    console.error(`\n${problems.length} i18n problem(s)`)
    process.exit(1)
}

console.log(`i18n ok: ${source.size} keys, ${locales.length} locales checked against ${SOURCE}`)
