import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const SHEETS = join(ROOT, 'docs', 'pages')
const NOT_SCREENS = ['design-system.md', 'book-page-view.md']
const problems: string[] = []

const tokens = readFileSync(join(ROOT, 'technical', 'Theme', 'app', 'assets', 'css', 'tokens.css'), 'utf8')
const css = readFileSync(join(ROOT, 'app', 'assets', 'css', 'main.css'), 'utf8')

const requirements: [string, string, RegExp][] = [
    ['tokens.css', 'background token', /--bg:\s*#FFF3DC/i],
    ['tokens.css', 'ink token', /--ink:\s*#1E1A3F/i],
    ['tokens.css', 'hard shadow token', /--shadow-lg:\s*4px 5px 0/],
    ['tokens.css', 'Fredoka font', /--font-body:\s*Fredoka/],
    ['tokens.css', 'tap target token of at least 44px', /--tap:\s*(4[4-9]|[5-9]\d)px/],
    ['tokens.css', 'dark theme tokens', /data-theme=['"]dark['"]/],
    ['main.css', 'reduced motion support', /prefers-reduced-motion/],
]
for (const [file, label, pattern] of requirements) {
    if (!pattern.test(file === 'tokens.css' ? tokens : css)) {
        problems.push(`${file}: missing ${label}`)
    }
}
if (/Nunito/.test(css) || /Nunito/.test(tokens)) {
    problems.push('Nunito is no longer part of the design: Fredoka only')
}

const parseBlock = (source: string, selector: RegExp): Record<string, string> => {
    const block = selector.exec(source)?.[1] ?? ''
    return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(match => [match[1] as string, (match[2] as string).trim()]))
}
const light = parseBlock(tokens, /:root\s*\{([^}]*)\}/)
const dark = { ...light, ...parseBlock(tokens, /:root\[data-theme='dark'\]\s*\{([^}]*)\}/) }

const luminance = (hex: string): number => {
    const value = hex.replace('#', '')
    const channels = [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16) / 255)
    const [red, green, blue] = channels.map(channel => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)) as [number, number, number]
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}
const contrast = (first: string, second: string): number => {
    const [high, low] = [luminance(first), luminance(second)].sort((left, right) => right - left) as [number, number]
    return (high + 0.05) / (low + 0.05)
}

const ACCENTS = ['yellow', 'sky', 'mint', 'mint-soft', 'mint-pale', 'lilac', 'pink-pale', 'coral', 'pink', 'violet', 'blue', 'danger-soft']
const pairs: [string, string, number][] = [
    ['ink', 'bg', 4.5],
    ['ink', 'paper', 4.5],
    ['ink-soft', 'bg', 4.5],
    ['ink-soft', 'paper', 4.5],
    ['danger', 'bg', 4.5],
    ['danger', 'paper', 4.5],
    ['grey-ui-ink', 'grey-ui', 4.5],
    ['chip-on-ink', 'chip-on-bg', 4.5],
    ['ink-soft', 'grey', 4.5],
    ['ink', 'grey', 4.5],
    ['bg', 'ink', 4.5],
    ['cream', 'night', 4.5],
    ['on-accent', 'cream', 4.5],
    ['line', 'bg', 3],
    ['line', 'paper', 3],
    ['line', 'grey-ui', 3],
    ['grey-line', 'bg', 3],
    ['grey-line', 'paper', 3],
    ['grey-line', 'grey-ui', 3],
    ...ACCENTS.map((accent): [string, string, number] => ['on-accent', accent, 4.5]),
]
for (const [name, theme] of [['light', light], ['dark', dark]] as const) {
    for (const [foreground, background, minimum] of pairs) {
        const first = theme[foreground]
        const second = theme[background]
        if (!first || !second) {
            problems.push(`${name} theme: missing token ${foreground} or ${background}`)
            continue
        }
        const ratio = contrast(first, second)
        if (ratio < minimum) {
            problems.push(`${name} theme: ${foreground} on ${background} has a contrast of ${ratio.toFixed(2)}, minimum ${minimum}`)
        }
    }
}

for (const sheet of readdirSync(SHEETS).filter(name => name.endsWith('.md') && !NOT_SCREENS.includes(name))) {
    const text = readFileSync(join(SHEETS, sheet), 'utf8')
    if (!/design audit checklist/i.test(text)) {
        problems.push(`docs/pages/${sheet}: missing the design audit checklist`)
    }
}

if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
}

console.log('design audit ok')
