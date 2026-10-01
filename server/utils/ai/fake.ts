import type { IAiImageResponse, IAiProvider, IAiTextRequest, IAiTextResponse } from './provider'

const FAKE_COST_USD = 0.01
const FAKE_PROMPT_TOKENS = 120
const FAKE_COMPLETION_TOKENS = 80

const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
)

const usage = () => ({ promptTokens: FAKE_PROMPT_TOKENS, completionTokens: FAKE_COMPLETION_TOKENS, costUsd: FAKE_COST_USD })

const draft = (language: string, lineCount: number) => ({
    title: 'Le petit zébu',
    subtitle: 'Une histoire du soir',
    language,
    style: 'soft watercolor',
    characters: [
        { name: 'Narrateur', color: null, description: '', isNarrator: true },
        { name: 'Zébu', color: 'coral', description: 'small brown zebu with a red scarf', isNarrator: false },
    ],
    pages: [
        { imageDescription: 'A zebu in a green field', panels: [] },
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
        return JSON.stringify({ suggestions: Array.from({ length: count }, (_, index) => ({ text: `[${target}] ${index + 1}`, tone: 'doux' })) })
    }
    const language = /LANGUAGE:([a-z-]+)/.exec(request.system)?.[1] ?? 'fr'
    return JSON.stringify(draft(language, 4))
}

export const createFakeProvider = (): IAiProvider => ({
    completeJson: async (request): Promise<IAiTextResponse> => ({ content: answer(request), ...usage() }),
    generateImage: async (request): Promise<IAiImageResponse> => {
        if (request.prompt.includes('FAKE_IMAGE_FAIL')) {
            throw new Error('fake image failure')
        }
        return { mime: 'image/png', data: PNG_PIXEL, ...usage() }
    },
})
