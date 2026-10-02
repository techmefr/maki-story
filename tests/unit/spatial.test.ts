import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickSpatialTarget } from '../../shared/utils/spatial.ts'

const rect = (x: number, y: number) => ({ x, y, width: 100, height: 50 }) as DOMRect
const grid = [rect(0, 0), rect(200, 0), rect(0, 100), rect(200, 100)]

test('moves to the nearest neighbour', () => {
    assert.equal(pickSpatialTarget(grid, 0, 'right'), 1)
    assert.equal(pickSpatialTarget(grid, 0, 'down'), 2)
    assert.equal(pickSpatialTarget(grid, 3, 'left'), 2)
    assert.equal(pickSpatialTarget(grid, 3, 'up'), 1)
})

test('stays put at the edges', () => {
    assert.equal(pickSpatialTarget(grid, 0, 'left'), -1)
    assert.equal(pickSpatialTarget(grid, 0, 'up'), -1)
})
