import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readAppearance, saveAppearance, isAppearance } from '../../shared/utils/appearance.ts'

test('appearance separates each profile and defaults a new profile to forest', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
    saveAppearance(storage, 'parent', 'library')
    saveAppearance(storage, 'child', 'notebook')
    assert.equal(readAppearance(storage, 'parent'), 'library')
    assert.equal(readAppearance(storage, 'child'), 'notebook')
    assert.equal(readAppearance(storage, 'new-child'), 'forest')
    assert.equal(readAppearance(storage, null), 'notebook')
})

test('appearance ignores corrupt storage and tolerates private browsing restrictions', () => {
    const corrupt = { getItem: () => 'unexpected', setItem: () => undefined }
    assert.equal(readAppearance(corrupt, 'parent'), 'forest')
    const blocked = { getItem: (): string | null => { throw new Error('blocked') }, setItem: (): void => { throw new Error('blocked') } }
    assert.equal(readAppearance(blocked, null), 'forest')
    assert.doesNotThrow(() => saveAppearance(blocked, 'parent', 'library'))
    assert.equal(isAppearance('dark'), false)
    assert.equal(isAppearance('library'), true)
})
