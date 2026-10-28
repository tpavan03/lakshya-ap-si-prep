import assert from 'node:assert/strict'
import test from 'node:test'
import { chooseAccountSeed, CloudSessionGuard } from '../src/hooks/cloudSyncPolicy'

test('manual and scheduled uploads cannot replace an account before hydration', () => {
  const guard = new CloudSessionGuard(), generation = guard.switchAccount('alice')
  assert.equal(guard.canUpload('alice', generation), false)
  guard.hydrated = true
  assert.equal(guard.canUpload('alice', generation), true)
})

test('late hydration and uploads from the previous session are rejected', () => {
  const guard = new CloudSessionGuard(), aliceGeneration = guard.switchAccount('alice')
  guard.hydrated = true
  const bobGeneration = guard.switchAccount('bob')
  assert.equal(guard.isCurrent('alice', aliceGeneration), false)
  assert.equal(guard.canUpload('alice', aliceGeneration), false)
  assert.equal(guard.canUpload('bob', bobGeneration), false)
  guard.hydrated = true
  assert.equal(guard.canUpload('bob', bobGeneration), true)
  guard.switchAccount('alice')
  assert.equal(guard.isCurrent('alice', aliceGeneration), false, 'switching back still invalidates the first session')
})

test('a new account never receives another account’s in-memory preparation history', () => {
  const seed = chooseAccountSeed({ userId: 'bob', owner: 'alice', current: { attempts: ['alice-only'] }, cached: null, explicitSignIn: true, empty: () => ({ attempts: [] }) })
  assert.deepEqual(seed, { attempts: [] })
})

test('guest work seeds a new account only after explicit sign in; a cache takes precedence', () => {
  const context = { userId: 'alice', owner: 'guest', current: { attempts: ['guest'] }, empty: () => ({ attempts: [] as string[] }) }
  assert.deepEqual(chooseAccountSeed({ ...context, cached: null, explicitSignIn: true }), { attempts: ['guest'] })
  assert.deepEqual(chooseAccountSeed({ ...context, cached: null, explicitSignIn: false }), { attempts: [] })
  assert.deepEqual(chooseAccountSeed({ ...context, cached: { attempts: ['alice-cache'] }, explicitSignIn: true }), { attempts: ['alice-cache'] })
})

test('unknown legacy ownership cannot seed a newly restored account', () => {
  assert.deepEqual(chooseAccountSeed({ userId: 'bob', owner: null, current: { attempts: ['unknown'] }, cached: null, explicitSignIn: false, empty: () => ({ attempts: [] }) }), { attempts: [] })
})
