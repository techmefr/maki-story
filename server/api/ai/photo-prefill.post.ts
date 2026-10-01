import { getDb } from '../../utils/db'
import { checkLanguage } from '../../utils/bookModel'
import { requireAiParent, runJsonJob } from '../../utils/ai/jobs'
import { resolveModels } from '../../utils/ai/provider'
import { photoPrefillSystem, photoPrefillUser } from '../../utils/ai/prompts'
import { parseBookDraft } from '../../utils/ai/schemas'
import { badRequest } from '../../utils/validate'

const MAX_PHOTOS = 4
const MAX_TOKENS = 6000

export default defineEventHandler(async (event): Promise<IAiPhotoPrefillResult> => {
    const ctx = await requireAiParent(event)
    const body = await readBody<Partial<IAiPhotoPrefillBody>>(event)
    const fileIds = [...new Set(Array.isArray(body.fileIds) ? body.fileIds : [])]
    if (fileIds.length === 0 || fileIds.length > MAX_PHOTOS || fileIds.some(id => typeof id !== 'string')) {
        return badRequest('Send between 1 and 4 photos')
    }
    const language = body.language === undefined ? 'fr' : checkLanguage(body.language)
    const db = getDb()
    const files = await db<{ id: string; mime: string; data: Buffer }[]>`
        select id, mime, data from files where family_id = ${ctx.familyId} and id in ${db(fileIds)}
    `
    if (files.length !== fileIds.length || files.some(file => !file.mime.startsWith('image/'))) {
        return badRequest('Unknown or unsupported photo')
    }
    const ordered = fileIds.map(id => files.find(file => file.id === id)!)
    const { jobId, result } = await runJsonJob(
        ctx,
        'photo_prefill',
        { fileIds, language },
        {
            model: resolveModels().vision,
            system: photoPrefillSystem(language),
            user: photoPrefillUser(ordered.length),
            images: ordered.map(file => ({ mime: file.mime, base64: file.data.toString('base64') })),
            maxTokens: MAX_TOKENS,
        },
        value => parseBookDraft(value, language),
    )
    return { jobId, draft: result }
})
