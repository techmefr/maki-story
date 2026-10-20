import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isLocalDemo, demoProfile, DEMO_PROFILES } from '../../shared/utils/demo.ts'

test('demo requires development, explicit flag, local host and isolated local database', () => {
    const db = 'postgresql://demo@127.0.0.1:5544/maki_demo'
    assert.equal(isLocalDemo(true, 'true', db, 'localhost'), true)
    assert.equal(isLocalDemo(false, 'true', db, 'localhost'), false)
    assert.equal(isLocalDemo(true, undefined, db, 'localhost'), false)
    assert.equal(isLocalDemo(true, 'true', db, 'example.com'), false)
    assert.equal(isLocalDemo(true, 'true', db.replace('127.0.0.1', 'remote.example'), 'localhost'), false)
    assert.equal(isLocalDemo(true, 'true', db.replace('maki_demo', 'production'), 'localhost'), false)
    assert.equal(isLocalDemo(true, 'true', 'invalid', 'localhost'), false)
})
test('demo accepts only explicit seeded profile identifiers', () => {
    for (const profile of DEMO_PROFILES) assert.equal(demoProfile(profile.id), profile)
    for (const value of ['parent@maki.demo', 'real-account', undefined, {}, null]) assert.equal(demoProfile(value), undefined)
})
