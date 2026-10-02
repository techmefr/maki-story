import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const PAGES = join(ROOT, 'app', 'pages')
const SHEETS = join(ROOT, 'docs', 'pages')

const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap(name => {
        const path = join(directory, name)
        return statSync(path).isDirectory() ? walk(path) : name.endsWith('.vue') ? [path] : []
    })

const routeOf = (file: string): string => {
    const parts = relative(PAGES, file).split(sep).join('/').replace(/\.vue$/, '').split('/')
    if (parts.at(-1) === 'index') {
        parts.pop()
    }
    return `/${parts.join('/')}`
}

const conventionOf = (route: string): string => (route === '/' ? 'index' : route.slice(1).replace(/\[(\w+)\]/g, '$1').replace(/\//g, '-'))

const declared = new Set<string>()
for (const sheet of readdirSync(SHEETS).filter(name => name.endsWith('.md'))) {
    for (const line of readFileSync(join(SHEETS, sheet), 'utf8').split('\n')) {
        if (line.startsWith('Routes:')) {
            line
                .slice('Routes:'.length)
                .split(',')
                .forEach(route => declared.add(route.trim()))
        }
    }
}

const missing = walk(PAGES)
    .map(routeOf)
    .filter(route => !declared.has(route) && !existsSync(join(SHEETS, `${conventionOf(route)}.md`)))
    .sort()

if (missing.length > 0) {
    console.error(`Routes without a docs/pages sheet:\n${missing.map(route => `  ${route}  (docs/pages/${conventionOf(route)}.md or a "Routes:" line)`).join('\n')}`)
    process.exit(1)
}

console.log('docs/pages ok: every route has a sheet')
