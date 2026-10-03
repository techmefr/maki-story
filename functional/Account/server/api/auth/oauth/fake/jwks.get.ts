import { assertFakeEnabled, fakeJwks } from '~~/technical/Auth/server/utils/oauth/fake'

export default defineEventHandler(() => {
    assertFakeEnabled()
    return fakeJwks()
})
