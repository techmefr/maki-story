import assert from 'node:assert/strict'
import { test } from 'node:test'
import { familyLanguagesOf } from '../../shared/utils/familyLanguages.ts'

const KNOWN = ['fr', 'mg', 'en', 'es']

test('the languages of the family are the languages spoken by its members, in the app order', () => {
    const members = [{ spokenLanguages: ['mg', 'fr'] }, { spokenLanguages: ['fr'] }, { spokenLanguages: ['xx'] }]
    assert.deepEqual(familyLanguagesOf(members, KNOWN, 'fr'), ['fr', 'mg'])
})

test('a family where nobody declared a language falls back to the default one', () => {
    assert.deepEqual(familyLanguagesOf([{ spokenLanguages: [] }], KNOWN, 'fr'), ['fr'])
    assert.deepEqual(familyLanguagesOf([], KNOWN, 'fr'), ['fr'])
})
