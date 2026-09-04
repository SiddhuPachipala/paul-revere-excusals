import assert from 'node:assert/strict'
import test from 'node:test'
import { isProfileComplete, missingProfileFields, positionOptions } from './profile.ts'

const completeProfile = {
  first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com',
  phone: '555-0100', company: 'A', ms_level: 'MS III',
  ms_instructor: 'Instructor', company_commander: 'Commander', position: 'S1 - Adjutant',
}

test('requires every memorandum profile field', () => {
  assert.equal(isProfileComplete(completeProfile), true)
  assert.deepEqual(missingProfileFields({ ...completeProfile, position: '  ', phone: null }), ['phone', 'position'])
})

test('position choices include assigned and unassigned cadets', () => {
  assert.ok(positionOptions.includes('Battalion Commander'))
  assert.ok(positionOptions.includes('Not assigned'))
})
