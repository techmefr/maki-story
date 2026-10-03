import { assertFakeEnabled, fakeJwks } from '~~/server/utils/oauth/fake'

export default defineEventHandler(() => {
    assertFakeEnabled()
    return fakeJwks()
})
