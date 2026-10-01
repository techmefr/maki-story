import { createFakeProvider } from './fake'
import { createOpenRouterProvider } from './openrouter'

export interface IAiImageInput {
    mime: string
    base64: string
}

export interface IAiUsage {
    promptTokens: number
    completionTokens: number
    costUsd: number
}

export interface IAiTextRequest {
    model: string
    system: string
    user: string
    images: IAiImageInput[]
    maxTokens: number
}

export interface IAiTextResponse extends IAiUsage {
    content: string
}

export interface IAiImageRequest {
    model: string
    prompt: string
}

export interface IAiImageResponse extends IAiUsage {
    mime: string
    data: Buffer
}

export interface IAiProvider {
    completeJson: (request: IAiTextRequest) => Promise<IAiTextResponse>
    generateImage: (request: IAiImageRequest) => Promise<IAiImageResponse>
}

export interface IAiModels {
    vision: string
    text: string
    image: string
}

export const DEFAULT_MODELS: IAiModels = {
    vision: 'google/gemini-2.5-flash',
    text: 'google/gemini-2.5-flash',
    image: 'google/gemini-2.5-flash-image',
}

export const resolveModels = (): IAiModels => ({
    vision: process.env.AI_MODEL_VISION || DEFAULT_MODELS.vision,
    text: process.env.AI_MODEL_TEXT || DEFAULT_MODELS.text,
    image: process.env.AI_MODEL_IMAGE || DEFAULT_MODELS.image,
})

export const resolveProvider = (): IAiProvider | null => {
    if (process.env.AI_PROVIDER === 'fake') {
        return createFakeProvider()
    }
    const apiKey = process.env.OPENROUTER_API_KEY
    return apiKey ? createOpenRouterProvider(apiKey) : null
}

export const requireProvider = (): IAiProvider => {
    const provider = resolveProvider()
    if (!provider) {
        throw createError({ statusCode: 503, statusMessage: 'AI is not configured' })
    }
    return provider
}
