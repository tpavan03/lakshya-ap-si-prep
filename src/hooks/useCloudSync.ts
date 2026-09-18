import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { cloudConfigured, supabase } from '../lib/supabase'

type SyncState = 'local' | 'loading' | 'synced' | 'saving' | 'error'

export function useCloudSync<T>(value: T, setValue: Dispatch<SetStateAction<T>>) {
  const [user, setUser] = useState<User | null>(null)
  const [syncState, setSyncState] = useState<SyncState>(cloudConfigured ? 'loading' : 'local')
  const hydratedUser = useRef<string | null>(null)
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])

  const upload = useCallback(async (payload: T) => {
    if (!supabase || !user) return
    setSyncState('saving')
    const { error } = await supabase.from('user_state').upsert({
      user_id: user.id,
      payload,
      schema_version: 1,
      updated_at: new Date().toISOString(),
    })
    setSyncState(error ? 'error' : 'synced')
  }, [user])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      hydratedUser.current = null
      setUser(session?.user ?? null)
      setSyncState(session?.user ? 'loading' : 'local')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !user || hydratedUser.current === user.id) return
    let cancelled = false
    setSyncState('loading')
    supabase.from('user_state').select('payload').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return
      if (error) { setSyncState('error'); return }
      hydratedUser.current = user.id
      if (data?.payload) {
        setValue(data.payload as T)
        setSyncState('synced')
      } else {
        void upload(valueRef.current)
      }
    })
    return () => { cancelled = true }
  }, [setValue, upload, user])

  useEffect(() => {
    if (!user || hydratedUser.current !== user.id) return
    const timer = window.setTimeout(() => void upload(value), 900)
    return () => window.clearTimeout(timer)
  }, [upload, user, value])

  const signInWithEmail = async (email: string) => {
    if (!supabase) return 'Supabase is not configured yet.'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    return error?.message ?? null
  }

  const signInWithGoogle = async () => {
    if (!supabase) return 'Supabase is not configured yet.'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error?.message ?? null
  }

  const signOut = async () => { if (supabase) await supabase.auth.signOut() }

  return { cloudConfigured, user, syncState, signInWithEmail, signInWithGoogle, signOut, syncNow: () => upload(value) }
}
