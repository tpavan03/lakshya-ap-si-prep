import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { cloudConfigured, supabase } from '../lib/supabase'

type SyncState = 'local' | 'loading' | 'synced' | 'saving' | 'error'
const nativeRedirect = 'com.tpavan.lakshya://login-callback'

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
    if (!supabase || !Capacitor.isNativePlatform()) return
    const client = supabase
    const handleAuthUrl = async (url: string) => {
      if (!url.startsWith(nativeRedirect)) return
      const parsed = new URL(url)
      const params = new URLSearchParams(parsed.hash.replace(/^#/, '') || parsed.search)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      const code = params.get('code')
      if (accessToken && refreshToken) await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      else if (code) await client.auth.exchangeCodeForSession(code)
      await Browser.close().catch(() => undefined)
    }
    void CapacitorApp.getLaunchUrl().then(result => { if (result?.url) void handleAuthUrl(result.url) })
    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => { void handleAuthUrl(url) })
    return () => { void listener.then(handle => handle.remove()) }
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
      options: { emailRedirectTo: Capacitor.isNativePlatform() ? nativeRedirect : window.location.origin },
    })
    return error?.message ?? null
  }

  const signInWithGoogle = async () => {
    if (!supabase) return 'Supabase is not configured yet.'
    const native = Capacitor.isNativePlatform()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: native ? nativeRedirect : window.location.origin, skipBrowserRedirect: native },
    })
    if (native && data.url) await Browser.open({ url: data.url })
    return error?.message ?? null
  }

  const signOut = async () => { if (supabase) await supabase.auth.signOut() }

  return { cloudConfigured, user, syncState, signInWithEmail, signInWithGoogle, signOut, syncNow: () => upload(value) }
}
