import type { IAiImageRequest, IAiImageResponse, IAiProvider, IAiTextRequest, IAiTextResponse, IAiUsage } from './provider'

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const TEXT_TIMEOUT_MS = 90_000
const IMAGE_TIMEOUT_MS = 150_000
const DATA_URL_PATTERN = /^data:([^;,]+);base64,(.+)$/s

interface IOpenRouterUsage {
    prompt_tokens?: number
    completion_tokens?: number
    cost?: number
}

interface IOpenRouterResponse {
    choices?: {
        message?: {
            content?: string | null
            images?: { image_url?: { url?: string } }[]
        }
    }[]
    usage?: IOpenRouterUsage
}

const readUsage = (usage: IOpenRouterUsage | undefined): IAiUsage => ({
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    costUsd: usage?.cost ?? 0,
})

export const createOpenRouterProvider = (apiKey: string): IAiProvider => {
    const post = async (body: object, timeoutMs: number): Promise<IOpenRouterResponse> => {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'x-title': 'Maki Story' },
            body: JSON.stringify({ ...body, usage: { include: true } }),
            signal: AbortSignal.timeout(timeoutMs),
        })
        if (!response.ok) {
            throw new Error(`OpenRouter answered ${response.status}`)
        }
        return (await response.json()) as IOpenRouterResponse
    }

    const completeJson = async (request: IAiTextRequest): Promise<IAiTextResponse> => {
        const userContent = [
            { type: 'text', text: request.user },
            ...request.images.map(image => ({ type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } })),
        ]
        const json = await post(
            {
                model: request.model,
                max_tokens: request.maxTokens,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: request.system },
                    { role: 'user', content: userContent },
                ],
            },
            TEXT_TIMEOUT_MS,
        )
        return { content: json.choices?.[0]?.message?.content ?? '', ...readUsage(json.usage) }
    }

    const generateImage = async (request: IAiImageRequest): Promise<IAiImageResponse> => {
        const json = await post(
            { model: request.model, modalities: ['image', 'text'], messages: [{ role: 'user', content: request.prompt }] },
            IMAGE_TIMEOUT_MS,
        )
        const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? ''
        const match = DATA_URL_PATTERN.exec(url)
        if (!match) {
            throw new Error('OpenRouter returned no image')
        }
        return { mime: match[1]!, data: Buffer.from(match[2]!, 'base64'), ...readUsage(json.usage) }
    }

    return { completeJson, generateImage }
}
