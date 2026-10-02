import type { IAiImageResponse, IAiProvider, IAiTextRequest, IAiTextResponse } from './provider'

const FAKE_COST_USD = 0.01
const FAKE_PROMPT_TOKENS = 120
const FAKE_COMPLETION_TOKENS = 80

const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
)

const usage = () => ({ promptTokens: FAKE_PROMPT_TOKENS, completionTokens: FAKE_COMPLETION_TOKENS, costUsd: FAKE_COST_USD })

const UNSAFE_TEXT = 'FAKE_UNSAFE_CONTENT'
const COSTLY_MODERATION_COST_USD = 0.005
const seenOnce = new Set<string>()

const draftMarker = (user: string): string => {
    const tags: string[] = []
    if (user.includes('FAKE_COSTLY_MODERATION')) {
        tags.push('FAKE_COSTLY_MODERATION')
    }
    if (user.includes('FAKE_MODERATION_DOWN')) {
        tags.push('FAKE_MODERATION_DOWN')
    }
    if (user.includes('FAKE_UNSAFE_ONCE') && !seenOnce.has(user)) {
        seenOnce.add(user)
        tags.push(UNSAFE_TEXT)
    } else if (user.includes('FAKE_UNSAFE_TEXT')) {
        tags.push(UNSAFE_TEXT)
    }
    return tags.length > 0 ? ` ${tags.join(' ')}` : ''
}

const draft = (language: string, lineCount: number, marker = '', imageMarker = '') => ({
    title: `Le petit zébu${marker}`,
    subtitle: 'Une histoire du soir',
    language,
    style: 'soft watercolor',
    characters: [
        { name: 'Narrateur', color: null, description: '', isNarrator: true },
        { name: 'Zébu', color: 'coral', description: 'small brown zebu with a red scarf', isNarrator: false },
    ],
    pages: [
        { imageDescription: `A zebu in a green field${imageMarker}`, panels: [] },
        { imageDescription: 'The zebu meets a lemur', panels: ['Close-up of the lemur'] },
    ],
    lines: Array.from({ length: lineCount }, (_, index) => ({
        pageIndex: index % 2,
        character: index % 2 === 0 ? 'Narrateur' : 'Zébu',
        text: `Réplique ${index + 1}`,
        tone: 'doux',
        sceneDescription: '',
    })),
})

const moderationAnswer = (request: IAiTextRequest): { content: string; costUsd: number } => {
    const user = request.user
    if (user.includes('FAKE_MODERATION_DOWN')) {
        throw new Error('fake moderation outage')
    }
    const isImage = request.images.length > 0
    const isUnsafe = isImage ? user.includes('FAKE_UNSAFE_IMAGE') : user.includes(UNSAFE_TEXT)
    const costUsd = user.includes('FAKE_COSTLY_MODERATION') ? COSTLY_MODERATION_COST_USD : 0
    return { content: JSON.stringify(isUnsafe ? { verdict: 'BLOCK', categories: ['violence'] } : { verdict: 'PASS', categories: [] }), costUsd }
}

const answer = (request: IAiTextRequest): string => {
    const marker = request.user
    if (marker.includes('FAKE_NOT_JSON')) {
        return 'this is not json'
    }
    if (marker.includes('FAKE_MALFORMED')) {
        return JSON.stringify({ unexpected: true })
    }
    if (marker.includes('FAKE_OVERSIZE')) {
        return JSON.stringify(draft('fr', 5000))
    }
    if (request.system.includes('TASK:translation')) {
        const count = (marker.match(/^\d+\. /gm) ?? []).length
        const target = /TARGET:([a-z-]+)/.exec(request.system)?.[1] ?? 'xx'
        const unsafe = marker.includes('FAKE_UNSAFE_TEXT') ? ` ${UNSAFE_TEXT}` : ''
        return JSON.stringify({ suggestions: Array.from({ length: count }, (_, index) => ({ text: `[${target}] ${index + 1}${unsafe}`, tone: 'doux' })) })
    }
    const language = /LANGUAGE:([a-z-]+)/.exec(request.system)?.[1] ?? 'fr'
    return JSON.stringify(draft(language, 4, draftMarker(marker), marker.includes('FAKE_UNSAFE_IMAGE') ? ' FAKE_UNSAFE_IMAGE' : ''))
}

export const createFakeProvider = (): IAiProvider => ({
    completeJson: async (request): Promise<IAiTextResponse> => {
        if (request.system.includes('TASK:moderation')) {
            const verdict = moderationAnswer(request)
            return { content: verdict.content, ...usage(), costUsd: verdict.costUsd }
        }
        return { content: answer(request), ...usage() }
    },
    generateImage: async (request): Promise<IAiImageResponse> => {
        if (request.prompt.includes('FAKE_IMAGE_FAIL')) {
            throw new Error('fake image failure')
        }
        return { mime: 'image/png', data: PNG_PIXEL, ...usage() }
    },
})
