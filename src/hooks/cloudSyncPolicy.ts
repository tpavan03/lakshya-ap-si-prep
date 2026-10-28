/** Pure session guard: no upload is authorised until that exact account is hydrated. */
export class CloudSessionGuard {
  userId: string | null = null
  generation = 0
  hydrated = false

  switchAccount(userId: string | null) {
    this.userId = userId
    this.hydrated = false
    return ++this.generation
  }

  isCurrent(userId: string, generation: number) {
    return this.userId === userId && this.generation === generation
  }

  canUpload(userId: string, generation: number) {
    return this.isCurrent(userId, generation) && this.hydrated
  }
}

/** Unknown or another account's local data is never a seed for the next account. */
export function chooseAccountSeed<T>({ userId, owner, current, cached, explicitSignIn, empty }: {
  userId: string; owner: string | null; current: T; cached: T | null; explicitSignIn: boolean; empty: () => T;
}): T {
  if (owner === userId) return current
  if (cached !== null) return cached
  if (owner === 'guest' && explicitSignIn) return current
  return empty()
}
