import type { MailParams, MailTemplateId } from './mailTemplates'

export interface IDigestItem {
    id: string
    kind: string
    payload: Record<string, string | number>
    count: number
}

export interface IDigestGroup {
    kind: string
    payload: Record<string, string | number>
    count: number
    itemIds: string[]
}

export interface IDedicatedMail {
    template: MailTemplateId
    params: MailParams
}

export const DIGEST_MAX_LINES = 10
export const DIGEST_RETENTION_DAYS = 30
export const DIGEST_STALE_DAYS = 7
export const MESSAGE_ACTIVE_LIMIT = 5

const subjectOf = (payload: Record<string, string | number>): string => String(payload.bookTitle ?? payload.childName ?? payload.fromName ?? payload.memberName ?? '')

export const groupDigestItems = (items: IDigestItem[]): IDigestGroup[] => {
    const groups = new Map<string, IDigestGroup>()
    for (const item of items) {
        const key = `${item.kind}:${subjectOf(item.payload)}`
        const known = groups.get(key)
        if (known) {
            known.count += item.count
            known.payload = { ...known.payload, ...item.payload }
            known.itemIds.push(item.id)
        } else {
            groups.set(key, { kind: item.kind, payload: { ...item.payload }, count: item.count, itemIds: [item.id] })
        }
    }
    return [...groups.values()]
}

export const digestDay = (now: Date): string => now.toISOString().slice(0, 10)

export const dedicatedMailFor = (groups: IDigestGroup[], activeMessages: number | null): IDedicatedMail | null => {
    const [group] = groups
    if (groups.length !== 1 || !group) {
        return null
    }
    const { kind, payload, count } = group
    if (kind === 'message_received' && count === 1) {
        return {
            template: 'new_voice',
            params: { name: String(payload.fromName ?? ''), child: String(payload.childName ?? ''), n: activeMessages === null ? '' : Math.min(activeMessages, MESSAGE_ACTIVE_LIMIT) },
        }
    }
    if (kind === 'recording_batch') {
        return { template: 'review_request', params: { name: String(payload.memberName ?? ''), book: String(payload.bookTitle ?? ''), count, bookId: String(payload.bookId ?? '') } }
    }
    if (kind === 'review_result' && Number(payload.returned ?? 0) > 0) {
        return {
            template: 'corrections',
            params: { parent: String(payload.memberName ?? ''), book: String(payload.bookTitle ?? ''), count: Number(payload.returned), comment: '', bookId: String(payload.bookId ?? '') },
        }
    }
    return null
}

export const dedicatedPath = (mail: IDedicatedMail): string => {
    const bookId = encodeURIComponent(String(mail.params.bookId ?? ''))
    if (mail.template === 'review_request') {
        return `/books/${bookId}/review`
    }
    if (mail.template === 'corrections') {
        return `/books/${bookId}/studio`
    }
    return '/messages'
}
