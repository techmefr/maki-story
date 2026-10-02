import { getDb } from '../db'
import { moderationSystem, moderationTextUser, moderationImageUser } from './prompts'
import { resolveModels } from './provider'
import type { IAiImageInput, IAiProvider, IAiUsage } from './provider'

export const MAX_REGENERATIONS = 1
export const MODERATION_UNAVAILABLE = 'moderation_unavailable'
export const MODERATION_STATUS_MESSAGE = 'Content blocked by moderation'

const MAX_MODERATED_CHARS = 20_000
const MAX_CATEGORIES = 6
const MAX_CATEGORY_CHARS = 40
const EXCERPT_CHARS = 80
const MODERATION_MAX_TOKENS = 300

export type ModerationSubject = 'TEXT' | 'IMAGE'
export type ModerationAction = 'NONE' | 'REGENERATED' | 'REFUSED'

export interface IModerationContext {
    familyId: string
    provider: IAiProvider
}

export interface IModerationVerdict {
    isBlocked: boolean
    categories: string[]
    usage: IAiUsage
}

const NO_USAGE: IAiUsage = { promptTokens: 0, completionTokens: 0, costUsd: 0 }

export const collectText = (value: unknown, out: string[] = []): string[] => {
    if (typeof value === 'string') {
        out.push(value)
    } else if (Array.isArray(value)) {
        value.forEach(item => collectText(item, out))
    } else if (typeof value === 'object' && value !== null) {
        Object.values(value as Record<string, unknown>).forEach(item => collectText(item, out))
    }
    return out
}

const parseVerdict = (content: string): { isBlocked: boolean; categories: string[] } => {
    const stripped = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(stripped) as { verdict?: unknown; categories?: unknown }
    if (parsed.verdict !== 'PASS' && parsed.verdict !== 'BLOCK') {
        throw new Error('Invalid moderation verdict')
    }
    const categories = Array.isArray(parsed.categories)
        ? parsed.categories.filter((item): item is string => typeof item === 'string').slice(0, MAX_CATEGORIES).map(item => item.slice(0, MAX_CATEGORY_CHARS))
        : []
    return { isBlocked: parsed.verdict === 'BLOCK', categories }
}

const ask = async (ctx: IModerationContext, user: string, images: IAiImageInput[], model: string): Promise<IModerationVerdict> => {
    try {
        const response = await ctx.provider.completeJson({ model, system: moderationSystem(), user, images, maxTokens: MODERATION_MAX_TOKENS })
        const usage = { promptTokens: response.promptTokens, completionTokens: response.completionTokens, costUsd: response.costUsd }
        return { ...parseVerdict(response.content), usage }
    } catch (_error) {
        return { isBlocked: true, categories: [MODERATION_UNAVAILABLE], usage: NO_USAGE }
    }
}

export const moderateText = (ctx: IModerationContext, text: string): Promise<IModerationVerdict> => {
    return ask(ctx, moderationTextUser(text.slice(0, MAX_MODERATED_CHARS)), [], resolveModels().text)
}

export const moderateImage = (ctx: IModerationContext, prompt: string, image: IAiImageInput): Promise<IModerationVerdict> => {
    return ask(ctx, moderationImageUser(prompt.slice(0, MAX_MODERATED_CHARS)), [image], resolveModels().vision)
}

export const logModeration = async (
    familyId: string,
    jobId: string,
    subject: ModerationSubject,
    verdict: IModerationVerdict,
    action: ModerationAction,
    excerpt: string,
    attempt: number,
): Promise<void> => {
    const db = getDb()
    await db`
        insert into moderation_log (family_id, ai_job_id, subject, verdict, categories, action, detail)
        values (${familyId}, ${jobId}, ${subject}, ${verdict.isBlocked ? 'BLOCKED' : 'PASSED'}, ${verdict.categories}, ${action},
            ${db.json({ excerpt: excerpt.replace(/\s+/g, ' ').slice(0, EXCERPT_CHARS), attempt } as never)})
    `
}
