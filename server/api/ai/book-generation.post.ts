import { getDb } from '../../utils/db'
import { checkAge, checkAgeRange, checkLanguage } from '../../utils/bookModel'
import { insertAiDraftBook } from '../../utils/ai/draftBook'
import { assertQuota, requireAiParent, runImageJob, runJsonJob, succeedJob } from '../../utils/ai/jobs'
import { resolveModels } from '../../utils/ai/provider'
import { bookGenerationSystem, bookGenerationUser, pageImagePrompt } from '../../utils/ai/prompts'
import { MAX_AI_PAGES, parseBookDraft } from '../../utils/ai/schemas'
import { badRequest } from '../../utils/validate'

const MAX_IDEA_CHARS = 1000
const DEFAULT_PAGES = 4
const MAX_TOKENS = 6000

export default defineEventHandler(async (event): Promise<IAiBookGenerationResult> => {
    const ctx = await requireAiParent(event)
    const body = await readBody<Partial<IAiBookGenerationBody>>(event)
    if (typeof body.idea !== 'string' || body.idea.trim() === '' || body.idea.length > MAX_IDEA_CHARS) {
        return badRequest('Invalid idea')
    }
    const pageCount = body.pageCount ?? DEFAULT_PAGES
    if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > MAX_AI_PAGES) {
        return badRequest('Invalid page count')
    }
    const language = body.language === undefined ? 'fr' : checkLanguage(body.language)
    const ageMin = checkAge(body.ageMin)
    const ageMax = checkAge(body.ageMax)
    checkAgeRange(ageMin, ageMax)
    const models = resolveModels()
    const idea = body.idea.trim()
    const { jobId, result: draft } = await runJsonJob(
        ctx,
        'book_generation',
        { idea, language, pageCount, ageMin, ageMax },
        { model: models.text, system: bookGenerationSystem(language, pageCount), user: bookGenerationUser(idea, ageMin, ageMax), images: [], maxTokens: MAX_TOKENS },
        value => parseBookDraft(value, language),
    )
    const db = getDb()
    const fileIds: (string | null)[] = []
    let imagesSkipped = 0
    for (let index = 0; index < draft.pages.length; index++) {
        try {
            await assertQuota(db, ctx.familyId)
            fileIds.push((await runImageJob(ctx, models.image, pageImagePrompt(draft, index), { page: index })).fileId)
        } catch (_error) {
            fileIds.push(null)
            imagesSkipped++
        }
    }
    const bookId = await insertAiDraftBook(db, ctx.familyId, draft, fileIds, ageMin, ageMax)
    await succeedJob(jobId, { bookId, imagesGenerated: fileIds.length - imagesSkipped, imagesSkipped })
    return { jobId, bookId, imagesGenerated: fileIds.length - imagesSkipped, imagesSkipped }
})
