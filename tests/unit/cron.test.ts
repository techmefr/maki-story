import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCronAuthorized } from '../../technical/Auth/server/utils/cron.ts'

test('cron refuses absent, malformed and incorrect credentials', () => {
    for (const header of [undefined, '', 'Bearer ', 'secret', 'Basic secret', 'Bearer wrong', 'Bearer secret-extra']) {
        assert.equal(isCronAuthorized(header, 'secret'), false)
    }
    assert.equal(isCronAuthorized('Bearer secret', undefined), false)
    assert.equal(isCronAuthorized('Bearer ', ''), false)
    assert.equal(isCronAuthorized('Bearer secrets', 'secreť'), false)
})

test('cron accepts only the exact configured bearer secret', () => {
    assert.equal(isCronAuthorized('Bearer secret', 'secret'), true)
    assert.equal(isCronAuthorized('bearer secret', 'secret'), false)
})
