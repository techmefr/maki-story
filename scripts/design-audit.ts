import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SHEETS = join(ROOT, 'docs', 'pages')
const NOT_SCREENS = ['design-system.md', 'book-page-view.md']
const problems: string[] = []

const css = readFileSync(join(ROOT, 'app', 'assets', 'css', 'main.css'), 'utf8')
const requirements: [string, RegExp][] = [
    ['hard shadow token', /--shadow:\s*3px 3px 0/],
    ['ink color', /--ink:\s*#1f1b3a/i],
    ['Fredoka font', /Fredoka/],
    ['Nunito font', /Nunito/],
    ['48px tap target token', /--tap:\s*48px/],
    ['reduced motion support', /prefers-reduced-motion/],
    ['dark theme tokens', /data-theme=['"]dark['"]/],
]
for (const [label, pattern] of requirements) {
    if (!pattern.test(css)) {
        problems.push(`main.css: missing ${label}`)
    }
}

for (const sheet of readdirSync(SHEETS).filter(name => name.endsWith('.md') && !NOT_SCREENS.includes(name))) {
    const text = readFileSync(join(SHEETS, sheet), 'utf8')
    if (!/design audit checklist/i.test(text)) {
        problems.push(`docs/pages/${sheet}: missing the design audit checklist`)
    }
    if (/- \[ \]/.test(text)) {
        problems.push(`docs/pages/${sheet}: unchecked item in the design audit checklist`)
    }
}

if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
}

console.log('design audit ok')
