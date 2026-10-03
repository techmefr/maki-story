import type { Sql, TransactionSql } from 'postgres'
import { getDb, one } from '../db'
import { record } from '../journal'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { collectText, logModeration, MAX_REGENERATIONS, MODERATION_STATUS_MESSAGE, moderateImage, moderateText } from './moderation'
import type { IModerationVerdict, ModerationAction, ModerationSubject } from './moderation'
import { requireProvider } from './provider'
import type { IAiProvider, IAiTextRequest, IAiUsage } from './provider'
import type { H3Event } from 'h3'

type Db = Sql | TransactionSql

const DEFAULT_MONTHLY_BUDGET_USD = 1
const DEFAULT_JOB_RESERVE_USD = 0.02
const MAX_BUDGET_USD = 1000
const MAX_MODEL_OUTPUT_CHARS = 200_000
const MAX_STORED_ERROR = 300

export interface IAiContext {
    familyId: string
    memberId: string
    provider: IAiProvider
}

export const defaultBudgetUsd = (): number => {
    const parsed = Number(process.env.AI_MONTHLY_BUDGET_USD)
    return process.env.AI_MONTHLY_BUDGET_USD !== undefined && Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MONTHLY_BUDGET_USD
}

const jobReserveUsd = (): number => {
    const parsed = Number(process.env.AI_JOB_RESERVE_USD)
    return process.env.AI_JOB_RESERVE_USD !== undefined && Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_JOB_RESERVE_USD
}

export const isValidBudget = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_BUDGET_USD

export const familyBudgetUsd = async (db: Db, familyId: string): Promise<{ budgetUsd: number; isCustom: boolean }> => {
    const [row] = await db<{ budget: number | null }[]>`select ai_monthly_budget_usd::float8 as budget from families where id = ${familyId}`
    return row?.budget === null || row?.budget === undefined ? { budgetUsd: defaultBudgetUsd(), isCustom: false } : { budgetUsd: row.budget, isCustom: true }
}

export const monthlySpentUsd = async (db: Db, familyId: string): Promise<number> => {
    const row = one(await db<{ spent: number }[]>`
        select coalesce(sum(cost_usd), 0)::float8 as spent from ai_jobs
        where family_id = ${familyId} and created_at >= date_trunc('month', now())
    `)
    return row.spent
}

const quotaExhausted = (): never => {
    throw createError({ statusCode: 429, statusMessage: 'Monthly AI budget exhausted' })
}

export const assertQuota = async (db: Db, familyId: string): Promise<void> => {
    const { budgetUsd } = await familyBudgetUsd(db, familyId)
    if ((await monthlySpentUsd(db, familyId)) >= budgetUsd) {
        quotaExhausted()
    }
}

export const requireParentMember = async (event: H3Event): Promise<{ familyId: string; memberId: string }> => {
    const actor = await requirePermission(event, 'ai.use')
    return { familyId: actor.familyId, memberId: requireActorMember(actor) }
}

export const requireAiParent = async (event: H3Event): Promise<IAiContext> => {
    const parent = await requireParentMember(event)
    return { ...parent, provider: requireProvider() }
}

const startJob = async (ctx: IAiContext, kind: AiJobKind, model: string, input: object): Promise<string> => {
    const db = getDb()
    const jobId = await db.begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext(${`ai-quota:${ctx.familyId}`}))`
        await assertQuota(tx, ctx.familyId)
        const job = one(await tx<{ id: string }[]>`
            insert into ai_jobs (family_id, member_id, kind, status, input, model, cost_usd)
            values (${ctx.familyId}, ${ctx.memberId}, ${kind}, 'running', ${tx.json(input as never)}, ${model}, ${jobReserveUsd()})
            returning id
        `)
        return job.id
    })
    await record(null, { familyId: ctx.familyId, actorMemberId: ctx.memberId, action: 'ai.job.started', entityType: 'ai_job', entityId: jobId, after: { kind } })
    return jobId
}

class UsageMeter {
    private prompt = 0
    private completion = 0
    private cost = 0
    hasUsage = false

    constructor(private readonly jobId: string) {}

    async add(usage: IAiUsage): Promise<void> {
        this.hasUsage = true
        this.prompt += usage.promptTokens
        this.completion += usage.completionTokens
        this.cost += usage.costUsd
        await getDb()`
            update ai_jobs set prompt_tokens = ${this.prompt}, completion_tokens = ${this.completion}, cost_usd = ${this.cost}
            where id = ${this.jobId}
        `
    }

    async release(): Promise<void> {
        if (!this.hasUsage) {
            await getDb()`update ai_jobs set cost_usd = 0 where id = ${this.jobId}`
        }
    }
}

export const failJob = async (jobId: string, message: string): Promise<void> => {
    await getDb()`
        update ai_jobs set status = 'failed', error = ${message.slice(0, MAX_STORED_ERROR)}, finished_at = now() where id = ${jobId}
    `
}

export const succeedJob = async (jobId: string, output: object): Promise<void> => {
    const db = getDb()
    await db`update ai_jobs set status = 'succeeded', output = ${db.json(output as never)}, finished_at = now() where id = ${jobId}`
}

const parseJson = (content: string): unknown => {
    if (content.length === 0 || content.length > MAX_MODEL_OUTPUT_CHARS) {
        throw new Error('Model output has an invalid size')
    }
    const stripped = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    return JSON.parse(stripped)
}

export const invalidModelOutput = (): never => {
    throw createError({ statusCode: 502, statusMessage: 'The model returned an invalid answer' })
}

export const MODERATION_BLOCKED_STATUS = 422

export const isModerationBlock = (error: unknown): boolean => (error as { statusCode?: number }).statusCode === MODERATION_BLOCKED_STATUS

const refuseBlocked = async (ctx: IAiContext, jobId: string, subject: ModerationSubject, verdict: IModerationVerdict, excerpt: string, attempt: number): Promise<never> => {
    await logModeration(ctx.familyId, jobId, subject, verdict, 'REFUSED', excerpt, attempt)
    await failJob(jobId, `${MODERATION_STATUS_MESSAGE}: ${verdict.categories.join(', ')}`)
    await record(null, { familyId: ctx.familyId, actorMemberId: ctx.memberId, action: 'ai.moderation.blocked', entityType: 'ai_job', entityId: jobId, after: { subject, categories: verdict.categories } })
    throw createError({ statusCode: MODERATION_BLOCKED_STATUS, statusMessage: MODERATION_STATUS_MESSAGE })
}

const noteRegeneration = async (ctx: IAiContext, jobId: string, subject: ModerationSubject, verdict: IModerationVerdict, excerpt: string, attempt: number): Promise<void> => {
    const action: ModerationAction = 'REGENERATED'
    await logModeration(ctx.familyId, jobId, subject, verdict, action, excerpt, attempt)
    await record(null, { familyId: ctx.familyId, actorMemberId: ctx.memberId, action: 'ai.moderation.blocked', entityType: 'ai_job', entityId: jobId, after: { subject, categories: verdict.categories, regenerated: true } })
    await assertQuota(getDb(), ctx.familyId)
}

export const runJsonJob = async <T>(
    ctx: IAiContext,
    kind: AiJobKind,
    input: object,
    request: IAiTextRequest,
    parse: (value: unknown) => T,
): Promise<{ jobId: string; result: T }> => {
    const jobId = await startJob(ctx, kind, request.model, input)
    const meter = new UsageMeter(jobId)
    for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt++) {
        let response
        try {
            response = await ctx.provider.completeJson(request)
        } catch (error) {
            await meter.release()
            await failJob(jobId, (error as Error).message)
            throw createError({ statusCode: 502, statusMessage: 'The AI provider failed' })
        }
        await meter.add(response)
        let result: T
        try {
            result = parse(parseJson(response.content))
        } catch (error) {
            await failJob(jobId, `Invalid model output: ${(error as Error).message}`)
            return invalidModelOutput()
        }
        const text = collectText(result).join('\n')
        const verdict = await moderateText(ctx, text)
        await meter.add(verdict.usage)
        if (!verdict.isBlocked) {
            await succeedJob(jobId, result as object)
            return { jobId, result }
        }
        if (attempt === MAX_REGENERATIONS) {
            return refuseBlocked(ctx, jobId, 'TEXT', verdict, text, attempt)
        }
        await noteRegeneration(ctx, jobId, 'TEXT', verdict, text, attempt)
    }
    return invalidModelOutput()
}

export const runImageJob = async (ctx: IAiContext, model: string, prompt: string, input: object): Promise<{ jobId: string; fileId: string }> => {
    const jobId = await startJob(ctx, 'image', model, input)
    const meter = new UsageMeter(jobId)
    for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt++) {
        let response
        try {
            response = await ctx.provider.generateImage({ model, prompt })
        } catch (error) {
            await meter.release()
            await failJob(jobId, (error as Error).message)
            throw createError({ statusCode: 502, statusMessage: 'The AI provider failed' })
        }
        await meter.add(response)
        if (!response.mime.startsWith('image/') || response.data.length === 0) {
            await failJob(jobId, 'Invalid image output')
            return invalidModelOutput()
        }
        const verdict = await moderateImage(ctx, prompt, { mime: response.mime, base64: response.data.toString('base64') })
        await meter.add(verdict.usage)
        if (!verdict.isBlocked) {
            const db = getDb()
            const file = one(await db<{ id: string }[]>`
                insert into files (family_id, mime, data) values (${ctx.familyId}, ${response.mime}, ${response.data})
                returning id
            `)
            await succeedJob(jobId, { fileId: file.id })
            return { jobId, fileId: file.id }
        }
        if (attempt === MAX_REGENERATIONS) {
            return refuseBlocked(ctx, jobId, 'IMAGE', verdict, prompt, attempt)
        }
        await noteRegeneration(ctx, jobId, 'IMAGE', verdict, prompt, attempt)
    }
    return invalidModelOutput()
}
