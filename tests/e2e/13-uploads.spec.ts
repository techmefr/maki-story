import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { createHash } from 'node:crypto'
import postgres from 'postgres'
import { UPLOAD_CHUNK_BYTES, UPLOAD_MAX_BYTES } from '../../shared/utils/upload'
import type { IUploadState } from '../../shared/types/upload'
import { signIn, uniqueAccount } from './helpers'

const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex')

const payload = Buffer.alloc(UPLOAD_CHUNK_BYTES * 2 + 12345)
for (let i = 0; i < payload.length; i++) {
    payload[i] = (i * 31 + (i >> 8)) % 251
}

const createUpload = async (api: APIRequestContext, size = payload.length, mime = 'audio/webm'): Promise<IUploadState> => {
    const response = await api.post('/api/uploads', { data: { size, mime } })
    expect(response.status()).toBe(200)
    return (await response.json()) as IUploadState
}

const append = (api: APIRequestContext, id: string, offset: number, chunk: Buffer) =>
    api.patch(`/api/uploads/${id}`, {
        data: chunk,
        headers: { 'content-type': 'application/octet-stream', 'upload-offset': String(offset) },
    })

test.describe('resumable chunked uploads', () => {
    let api: APIRequestContext

    test.beforeAll(async ({ playwright }, testInfo) => {
        api = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL })
        await signIn(api, uniqueAccount(`upload-${testInfo.project.name}`))
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test('resuming after an interruption yields identical bytes', async () => {
        const session = await createUpload(api)
        expect(session.offset).toBe(0)
        const first = await append(api, session.id, 0, payload.subarray(0, UPLOAD_CHUNK_BYTES))
        expect(((await first.json()) as IUploadState).offset).toBe(UPLOAD_CHUNK_BYTES)

        const resumed = (await (await api.get(`/api/uploads/${session.id}`)).json()) as IUploadState
        expect(resumed.offset).toBe(UPLOAD_CHUNK_BYTES)

        const replay = await append(api, session.id, 0, payload.subarray(0, UPLOAD_CHUNK_BYTES))
        expect(replay.status()).toBe(200)
        expect(((await replay.json()) as IUploadState).offset).toBe(UPLOAD_CHUNK_BYTES)

        let offset = resumed.offset
        while (offset < payload.length) {
            const response = await append(api, session.id, offset, payload.subarray(offset, offset + UPLOAD_CHUNK_BYTES))
            expect(response.ok()).toBeTruthy()
            offset = ((await response.json()) as IUploadState).offset
        }

        const finished = await api.post(`/api/uploads/${session.id}/finish`)
        expect(finished.ok()).toBeTruthy()
        const { id } = (await finished.json()) as { id: string }
        const file = await api.get(`/api/files/${id}`)
        expect(file.headers()['content-type']).toBe('audio/webm')
        expect(sha256(await file.body())).toBe(sha256(payload))
        expect((await api.get(`/api/uploads/${session.id}`)).status()).toBe(404)
    })

    test('a wrong offset is refused with the current offset', async () => {
        const session = await createUpload(api)
        await append(api, session.id, 0, payload.subarray(0, 1000))
        const response = await append(api, session.id, 5000, payload.subarray(5000, 6000))
        expect(response.status()).toBe(409)
        const body = (await response.json()) as { data: IUploadState }
        expect(body.data.offset).toBe(1000)
    })

    test('finishing an incomplete upload is refused', async () => {
        const session = await createUpload(api)
        await append(api, session.id, 0, payload.subarray(0, 1000))
        expect((await api.post(`/api/uploads/${session.id}/finish`)).status()).toBe(409)
    })

    test('oversize, empty and unsupported uploads are refused', async () => {
        expect((await api.post('/api/uploads', { data: { size: UPLOAD_MAX_BYTES + 1, mime: 'audio/webm' } })).status()).toBe(400)
        expect((await api.post('/api/uploads', { data: { size: 0, mime: 'audio/webm' } })).status()).toBe(400)
        expect((await api.post('/api/uploads', { data: { size: 10, mime: 'text/html' } })).status()).toBe(400)
        const session = await createUpload(api, 500)
        expect((await append(api, session.id, 0, payload.subarray(0, 600))).status()).toBe(400)
    })

    test('another family cannot read, write or finish an upload', async ({ playwright }, testInfo) => {
        const session = await createUpload(api)
        await append(api, session.id, 0, payload.subarray(0, 1000))
        const intruder = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL })
        await signIn(intruder, uniqueAccount(`intruder-${testInfo.project.name}`))
        expect((await intruder.get(`/api/uploads/${session.id}`)).status()).toBe(404)
        expect((await append(intruder, session.id, 1000, payload.subarray(1000, 2000))).status()).toBe(404)
        expect((await intruder.post(`/api/uploads/${session.id}/finish`)).status()).toBe(404)
        expect((await intruder.delete(`/api/uploads/${session.id}`)).status()).toBe(404)
        await intruder.dispose()
        expect((await api.get(`/api/uploads/${session.id}`)).ok()).toBeTruthy()
    })

    test('an expired upload is gone and aborting works', async () => {
        const session = await createUpload(api)
        await append(api, session.id, 0, payload.subarray(0, 1000))
        const db = postgres(process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e', { max: 1 })
        try {
            await db`update upload_sessions set expires_at = now() - interval '1 minute' where id = ${session.id}`
        } finally {
            await db.end()
        }
        expect((await api.get(`/api/uploads/${session.id}`)).status()).toBe(410)
        expect((await append(api, session.id, 1000, payload.subarray(1000, 2000))).status()).toBe(404)

        const aborted = await createUpload(api)
        expect((await api.delete(`/api/uploads/${aborted.id}`)).ok()).toBeTruthy()
        expect((await api.get(`/api/uploads/${aborted.id}`)).status()).toBe(404)
    })
})
