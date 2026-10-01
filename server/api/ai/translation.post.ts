import { checkLanguage } from '../../utils/bookModel'
import { requireAiParent, runJsonJob } from '../../utils/ai/jobs'
import { resolveModels } from '../../utils/ai/provider'
import { translationSystem, translationUser } from '../../utils/ai/prompts'
import { MAX_AI_TRANSLATION_LINES, parseTranslations } from '../../utils/ai/schemas'
import { badRequest, isNonEmptyString } from '../../utils/validate'

const MAX_LINE_CHARS = 500
const MAX_TOKENS = 4000

export default defineEventHandler(async (event): Promise<IAiTranslationResult> => {
    const ctx = await requireAiParent(event)
    const body = await readBody<Partial<IAiTranslationBody>>(event)
    const lines = Array.isArray(body.lines) ? body.lines : []
    if (lines.length === 0 || lines.length > MAX_AI_TRANSLATION_LINES) {
        return badRequest('Invalid lines')
    }
    const clean = lines.map((line): IAiTranslationLine => {
        if (!isNonEmptyString(line?.text) || line.text.length > MAX_LINE_CHARS || (line.tone !== undefined && (typeof line.tone !== 'string' || line.tone.length > MAX_LINE_CHARS))) {
            return badRequest('Invalid line')
        }
        return { text: line.text.trim(), tone: line.tone?.trim() ?? '' }
    })
    const target = checkLanguage(body.targetLanguage)
    const source = body.sourceLanguage === undefined ? undefined : checkLanguage(body.sourceLanguage)
    const { jobId, result } = await runJsonJob(
        ctx,
        'translation',
        { lineCount: clean.length, target, source: source ?? null },
        { model: resolveModels().text, system: translationSystem(target, source), user: translationUser(clean), images: [], maxTokens: MAX_TOKENS },
        value => ({ suggestions: parseTranslations(value, clean.length) }),
    )
    return { jobId, suggestions: result.suggestions }
})
