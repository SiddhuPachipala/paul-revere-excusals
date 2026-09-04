import assert from 'node:assert/strict'
import test from 'node:test'
import { semesterOptions } from './semester.ts'

test('offers the current spring and following fall early in the year', () => {
  assert.deepEqual(semesterOptions(new Date('2026-02-01T12:00:00Z')), ['Spring 2026', 'Fall 2026'])
})

test('offers the coming fall and following spring later in the year', () => {
  assert.deepEqual(semesterOptions(new Date('2026-09-01T12:00:00Z')), ['Fall 2026', 'Spring 2027'])
})
