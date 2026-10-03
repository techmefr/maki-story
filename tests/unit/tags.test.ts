import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_TAGS, checkTagInput, missingTagLanguages, slugForNames, slugifyTag, suggestTagSlugs, tagLabel } from '../../shared/utils/tags.ts'

test('a label falls back from the chosen language to English then to the slug', () => {
    const tag = { slug: 'ocean', names: { fr: 'Océan', en: 'Ocean' } }
    assert.equal(tagLabel(tag, 'fr'), 'Océan')
    assert.equal(tagLabel(tag, 'mg'), 'Ocean')
    assert.equal(tagLabel({ slug: 'ocean', names: { fr: 'Océan' } }, 'mg'), 'ocean')
    assert.equal(tagLabel({ slug: 'ocean', names: { fr: 'Océan', mg: '  ' } }, 'mg'), 'ocean')
})

test('the slug comes from the English name, then the French one', () => {
    assert.equal(slugForNames({ fr: 'Château fort', en: 'Castle' }), 'castle')
    assert.equal(slugForNames({ fr: 'Château fort', en: '' }), 'chateau-fort')
    assert.equal(slugForNames({ mg: 'Ala be' }), 'ala-be')
    assert.equal(slugifyTag('  Où est l’ours ?  '), 'ou-est-l-ours')
})

test('a tag needs a name, a valid colour and icon and a free slug', () => {
    const base = { names: { fr: 'Dragons' }, color: 'coral', icon: 'star' } as const
    assert.equal(checkTagInput({ ...base }, []), null)
    assert.equal(checkTagInput({ ...base, names: { fr: ' ' } }, []), 'name-required')
    assert.equal(checkTagInput({ ...base, names: { fr: '???' } }, []), 'slug-empty')
    assert.equal(checkTagInput({ ...base }, ['dragons']), 'slug-taken')
    assert.equal(checkTagInput({ ...base }, ['dragons'], 'dragons'), null)
    assert.equal(checkTagInput({ ...base, color: 'red' as 'coral' }, []), 'color-invalid')
    assert.equal(checkTagInput({ ...base, icon: 'bomb' as 'star' }, []), 'icon-invalid')
    assert.equal(checkTagInput({ ...base, names: { french: 'x' } }, []), 'language-invalid')
})

test('missing translations are counted for the languages of the family only', () => {
    const tag = { names: { fr: 'Forêt', en: 'Forest' } }
    assert.deepEqual(missingTagLanguages(tag, ['fr', 'mg']), ['mg'])
    assert.deepEqual(missingTagLanguages(tag, ['fr', 'en']), [])
})

test('subjects found online suggest the matching tags', () => {
    const suggested = suggestTagSlugs(DEFAULT_TAGS, ['Juvenile Fiction / Westerns', 'Cowboys', 'Humorous Stories'])
    assert.deepEqual(suggested, ['western', 'funny'])
    assert.deepEqual(suggestTagSlugs(DEFAULT_TAGS, []), [])
})

test('every default tag has a unique slug equal to the slug of its English name', () => {
    const slugs = DEFAULT_TAGS.map(tag => tag.slug)
    assert.equal(new Set(slugs).size, slugs.length)
    for (const tag of DEFAULT_TAGS) {
        assert.equal(slugForNames(tag.names), tag.slug)
    }
})
