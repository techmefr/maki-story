import type { Sql } from 'postgres'
import { getDb, one } from '../db'
import { requireMember, requireSession } from '../family'
import { requireProvider } from './provider'
import type { IAiProvider, IAiTextRequest, IAiUsage } from './provider'
import type { H3Event } from 'h3'

const DEFAULT_MONTHLY_BUDGET_USD = 1
const MAX_MODEL_OUTPUT_CHARS = 200_000
const MAX_STORED_ERROR = 300

export interface IAiContext {
    familyId: string
    memberId: string
    provider: IAiProvider
}

export const monthlyBudgetUsd = (): number => {
    const parsed = Number(process.env.AI_MONTHLY_BUDGET_USD)
    return process.env.AI_MONTHLY_BUDGET_USD !== undefined && Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MONTHLY_BUDGET_USD
}

export const monthlySpentUsd = async (db: Sql, familyId: string): Promise<number> => {
    const row = one(await db<{ spent: number }[]>`
        select coalesce(sum(cost_usd), 0)::float8 as spent from ai_jobs
        where family_id = ${familyId} and created_at >= date_trunc('month', now())
    `)
    return row.spent
}

export const assertQuota = async (db: Sql, familyId: string): Promise<void> => {
    if ((await monthlySpentUsd(db, familyId)) >= monthlyBudgetUsd()) {
        throw createError({ statusCode: 429, statusMessage: 'Monthly AI budget exhausted' })
    }
}

export const requireParentMember = async (event: H3Event): Promise<{ familyId: string; memberId: string }> => {
    const { familyId } = requireSession(event)
    const memberId = requireMember(event)
    const rows = await getDb()<{ role: string }[]>`
        select role from members where id = ${memberId} and family_id = ${familyId} and deleted_at is null and status = 'active'
    `
    if (rows[0]?.role !== 'parent') {
        throw createError({ statusCode: 403, statusMessage: 'Only a parent can use AI' })
    }
    return { familyId, memberId }
}

export const requireAiParent = async (event: H3Event): Promise<IAiContext> => {
    const parent = await requireParentMember(event)
    return { ...parent, provider: requireProvider() }
}

const startJob = async (ctx: IAiContext, kind: AiJobKind, model: string, input: object): Promise<string> => {
    const db = getDb()
    await assertQuota(db, ctx.familyId)
    const job = one(await db<{ id: string }[]>`
        insert into ai_jobs (family_id, member_id, kind, status, input, model)
        values (${ctx.familyId}, ${ctx.memberId}, ${kind}, 'running', ${db.json(input as never)}, ${model})
        returning id
    `)
    return job.id
}

const recordUsage = async (jobId: string, usage: IAiUsage): Promise<void> => {
    await getDb()`
        update ai_jobs set prompt_tokens = ${usage.promptTokens}, completion_tokens = ${usage.completionTokens}, cost_usd = ${usage.costUsd}
        where id = ${jobId}
    `
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

export const runJsonJob = async <T>(
    ctx: IAiContext,
    kind: AiJobKind,
    input: object,
    request: IAiTextRequest,
    parse: (value: unknown) => T,
): Promise<{ jobId: string; result: T }> => {
    const jobId = await startJob(ctx, kind, request.model, input)
    let response
    try {
        response = await ctx.provider.completeJson(request)
    } catch (error) {
        await failJob(jobId, (error as Error).message)
        throw createError({ statusCode: 502, statusMessage: 'The AI provider failed' })
    }
    await recordUsage(jobId, response)
    let result: T
    try {
        result = parse(parseJson(response.content))
    } catch (error) {
        await failJob(jobId, `Invalid model output: ${(error as Error).message}`)
        return invalidModelOutput()
    }
    await succeedJob(jobId, result as object)
    return { jobId, result }
}

export const runImageJob = async (ctx: IAiContext, model: string, prompt: string, input: object): Promise<{ jobId: string; fileId: string }> => {
    const jobId = await startJob(ctx, 'image', model, input)
    let response
    try {
        response = await ctx.provider.generateImage({ model, prompt })
    } catch (error) {
        await failJob(jobId, (error as Error).message)
        throw createError({ statusCode: 502, statusMessage: 'The AI provider failed' })
    }
    await recordUsage(jobId, response)
    if (!response.mime.startsWith('image/') || response.data.length === 0) {
        await failJob(jobId, 'Invalid image output')
        return invalidModelOutput()
    }
    const db = getDb()
    const file = one(await db<{ id: string }[]>`
        insert into files (family_id, mime, data) values (${ctx.familyId}, ${response.mime}, ${response.data})
        returning id
    `)
    await succeedJob(jobId, { fileId: file.id })
    return { jobId, fileId: file.id }
}
