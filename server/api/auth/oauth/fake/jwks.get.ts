import { assertFakeEnabled, fakeJwks } from '../../../../utils/oauth/fake'

export default defineEventHandler(() => {
    assertFakeEnabled()
    return fakeJwks()
})
