import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canAccessVault } from '../../shared/utils/vaultAccess.ts'

test('each role can access only its own private vault', () => {
    for (const role of ['parent', 'relative', 'child']) {
        assert.equal(canAccessVault(role, 'self', role, 'self'), true)
        assert.equal(canAccessVault(role, 'self', 'parent', 'other'), false)
        assert.equal(canAccessVault(role, 'self', 'relative', 'other'), false)
    }
})

test('only a parent can also manage a child vault', () => {
    assert.equal(canAccessVault('parent', 'parent', 'child', 'child'), true)
    assert.equal(canAccessVault('relative', 'relative', 'child', 'child'), false)
    assert.equal(canAccessVault('child', 'child-one', 'child', 'child-two'), false)
})
