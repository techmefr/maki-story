import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SCANNED = ['app', 'server', 'shared']
const EXTENSIONS = ['.ts', '.vue']
const COMMENT = /^\s*(\/\/|\/\*|\*\s|<!--)/
const problems: string[] = []

const walk = (directory: string): string[] =>
    readdirSync(directory).flatMap(name => {
        const path = join(directory, name)
        if (path.includes('node_modules')) {
            return []
        }
        return statSync(path).isDirectory() ? walk(path) : EXTENSIONS.some(extension => name.endsWith(extension)) ? [path] : []
    })

for (const directory of SCANNED) {
    for (const file of walk(join(ROOT, directory))) {
        readFileSync(file, 'utf8')
            .split('\n')
            .forEach((line, index) => {
                const where = `${relative(ROOT, file)}:${index + 1}`
                if (COMMENT.test(line)) {
                    problems.push(`${where}: comment`)
                }
                if (/console\.log\(/.test(line)) {
                    problems.push(`${where}: console.log`)
                }
                if (/[ \t]+$/.test(line)) {
                    problems.push(`${where}: trailing whitespace`)
                }
            })
    }
}

if (problems.length > 0) {
    console.error(problems.slice(0, 80).join('\n'))
    console.error(`\n${problems.length} lint problem(s)`)
    process.exit(1)
}

console.log('lint ok')
