import { promises as fs } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export type FeedbackStatus = 'todo' | 'doing' | 'done'

export interface FeedbackItem {
    id: string
    createdAt: string
    status: FeedbackStatus
    comment: string
    category?: string
    route?: string
    target?: Record<string, unknown> | null
    reply?: string
}

const FEEDBACK_DIR = resolve(process.cwd(), '.design-feedback')

export const branchFileName = (branch: string): string => `${branch.trim().replace(/[^\w.-]+/g, '__') || 'default'}.json`

export const branchFromHead = (head: string): string | null => /^ref: refs\/heads\/(.+)$/m.exec(head.trim())?.[1] ?? null

const gitDir = async (root: string): Promise<string> => {
    const dotGit = join(root, '.git')
    const stat = await fs.stat(dotGit).catch(() => null)
    if (!stat?.isFile()) {
        return dotGit
    }
    const pointer = /^gitdir: (.+)$/m.exec(await fs.readFile(dotGit, 'utf8'))?.[1]?.trim()
    return pointer ? resolve(root, pointer) : dotGit
}

export const currentBranch = async (): Promise<string> => {
    try {
        const head = await fs.readFile(join(await gitDir(process.cwd()), 'HEAD'), 'utf8')
        return branchFromHead(head) ?? 'default'
    } catch {
        return 'default'
    }
}

export const feedbackFile = async (): Promise<string> => join(FEEDBACK_DIR, branchFileName(await currentBranch()))

export const readItems = async (file: string): Promise<FeedbackItem[]> => {
    try {
        return JSON.parse(await fs.readFile(file, 'utf8')) as FeedbackItem[]
    } catch {
        return []
    }
}

export const writeItems = async (file: string, items: FeedbackItem[]): Promise<void> => {
    await fs.mkdir(dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(items, null, 2) + '\n', 'utf8')
}

export const formatId = (n: number): string => `R${String(n).padStart(3, '0')}`

export const nextId = (items: FeedbackItem[]): string =>
    formatId(Math.max(0, ...items.map(item => Number(/^R(\d+)$/.exec(item.id)?.[1] ?? 0))) + 1)
