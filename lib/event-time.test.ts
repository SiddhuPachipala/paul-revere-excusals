import assert from 'node:assert/strict'
import test from 'node:test'
import { parseNewYorkLocal, toNewYorkLocalInput } from './event-time.ts'

test('parses Eastern standard time independently of the server timezone', () => {
  assert.equal(parseNewYorkLocal('2026-01-15T06:30')?.toISOString(), '2026-01-15T11:30:00.000Z')
})

test('parses Eastern daylight time independently of the server timezone', () => {
  assert.equal(parseNewYorkLocal('2026-07-15T06:30')?.toISOString(), '2026-07-15T10:30:00.000Z')
})

test('round-trips stored timestamps for event form editing', () => {
  assert.equal(toNewYorkLocalInput('2026-07-15T10:30:00.000Z'), '2026-07-15T06:30')
})

test('rejects a nonexistent local time during the spring DST transition', () => {
  assert.equal(parseNewYorkLocal('2026-03-08T02:30'), null)
})
