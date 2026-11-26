'use client'

import Link from 'next/link'
import FormField from '../form-field'
import { validContactEmail } from '../../lib/contact-format'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { isAuthApiError, type Session } from '@supabase/supabase-js'
import { getBrowserClient } from '../../lib/browser-auth'
import StaffDashboard from './staff-dashboard'

type Profile = { role: 'client' | 'consultant' | 'admin'; enabled: boolean }

export default function Account({ staff = false, dashboard = false }: { staff?: boolean; dashboard?: boolean }) {
  const supabase = getBrowserClient()
  const router = useRouter()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [profileResult, setProfileResult] = useState<{ userId: string; profile: Profile | null; passwordVerified: boolean }>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [reset, setReset] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const userId = session?.user.id
  const profile = profileResult?.userId === userId ? profileResult?.profile : undefined
  const passwordVerified = profileResult?.userId === userId && profileResult?.passwordVerified
  const token = session?.access_token

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, current) => setSession(current))
    return () => data.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!supabase || !userId || !token) return
    let active = true
    void Promise.all([
      supabase.from('profiles').select('role,enabled').eq('user_id', userId).single(),
      staff ? supabase.auth.getClaims(token) : null,
    ]).then(([{ data }, claims]) => {
      if (active) setProfileResult({
        userId,
        profile: data as Profile | null,
        passwordVerified: claims?.data?.claims.amr?.some(item => item.method === 'password') ?? false,
      })
    })
    return () => { active = false }
  }, [supabase, userId, token, staff])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    setBusy(true)
    setMessage('')
    try {
      if (staff && reset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: new URL('/staff/setup', window.location.origin).href,
        })
        if (error) throw error
        setMessage('If this address has an account, check your inbox for a reset link.')
      } else if (staff) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: String(form.get('password')) })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email, options: { emailRedirectTo: new URL('/consultation', window.location.origin).href },
        })
        if (error) throw error
        setMessage('Check your inbox for your sign-in link.')
      }
    } catch (error) {
      if (staff && !reset) {
        if (isAuthApiError(error) && error.status === 429) {
          setMessage('Too many sign-in attempts. Wait a moment and try again.')
        } else if (isAuthApiError(error) && error.code === 'invalid_credentials') {
          setMessage('That email and password don’t match. Check both and try again.')
        } else if (isAuthApiError(error) && error.code === 'email_not_confirmed') {
          setMessage('Confirm your email before signing in.')
        } else {
          setMessage('Staff sign-in is temporarily unavailable. Try again shortly.')
        }
      } else {
        setMessage('We could not send the email. Try again shortly.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      const result = await supabase?.auth.signOut({ scope: 'local' })
      if (result?.error) throw result.error
      setSession(null)
      setProfileResult(undefined)
      setReset(false)
      setShowPassword(false)
    } catch {
      setMessage('Could not sign out. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const staffAuthorized = staff && passwordVerified && profile?.enabled &&
    (profile.role === 'admin' || profile.role === 'consultant')
  let destination: string | undefined
  if (supabase && dashboard && (session === null || (session && profile !== undefined && !staffAuthorized))) destination = '/staff/login'
  if (staffAuthorized && !dashboard) destination = '/staff/dashboard'
  if (!staff && session && profile?.enabled) destination = profile.role === 'client' ? '/dashboard' : '/staff/login'

  useEffect(() => {
    if (destination) router.replace(destination)
  }, [destination, router])

  const pageTitle = staff ? <h1 className="staff-sign-in-title">{dashboard ? 'Staff dashboard' : 'Staff sign-in'}</h1> : null
  if (!supabase) return <>{pageTitle}<p>Account sign-in will be available when Supabase is connected.</p></>
  if (destination || session === undefined || (session && profile === undefined)) return <>{pageTitle}<p role="status">Checking your sign-in…</p></>

  if (dashboard && staffAuthorized && session) {
    const nickname = session.user.app_metadata.staff_nickname
    return <StaffDashboard key={session.user.id} token={session.access_token} admin={profile.role === 'admin'}
      email={session.user.email ?? ''} name={typeof nickname === 'string' ? nickname : null}
      signingOut={busy} message={message} onSignOut={signOut} />
  }

  return <>
    {pageTitle}
    {session ? <div className="consult-panel">
      <h2>Account details</h2>
      <p>{session.user.email}</p>
      {profile === undefined && <p role="status">Loading your account…</p>}
      {profile === null && <p role="alert">We could not load your account details.</p>}
      {profile && !profile.enabled && <p role="alert">Your account is disabled. Contact a First ID PH admin for help.</p>}
      {profile?.enabled && staff && profile.role === 'client' && <p role="alert">This account does not have staff access.</p>}
      {profile?.enabled && staff && profile.role !== 'client' && !passwordVerified && <p>Sign out, then sign in with your staff password to continue.</p>}
      {profile?.enabled && !staff && profile.role === 'client' && <p><Link className="text-link" href="/consultation">View your consultations ↗</Link></p>}
      {profile?.enabled && !staff && profile.role !== 'client' && <p><Link className="text-link" href="/staff/login">Go to staff sign-in ↗</Link></p>}
      <button className="button button-outline" type="button" disabled={busy} onClick={signOut}>Sign out</button>
    </div> : <form className="consult-panel" onSubmit={signIn}>
      <h2>{staff ? (reset ? 'Reset your password' : 'Sign in as staff') : 'Sign up or sign in'}</h2>
      {!staff && <p>Use your email to receive a secure sign-in link.</p>}
      <FormField label="Email address" validate={value => validContactEmail(value) ? undefined : 'Use an address like name@example.com.'}><input type="email" name="email" autoComplete="email" placeholder="e.g. name@example.com" required /></FormField>
      {staff && !reset && <div className="staff-password-field">
        <FormField label="Password"><input type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" placeholder="Enter your password" required /></FormField>
        <button type="button" className="button button-outline" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
      </div>}
      <button className="button button-primary" disabled={busy}>{staff ? (reset ? 'Send reset link' : 'Sign in') : 'Email me a sign-in link'}</button>
      {staff ? <p><button type="button" className="text-link" disabled={busy} onClick={() => { setReset(!reset); setMessage('') }}>{reset ? 'Back to staff sign-in' : 'Forgot your password?'}</button></p>
        : <p><Link className="text-link" href="/staff/login">Staff sign-in ↗</Link></p>}
    </form>}
    <p role="status">{message}</p>
  </>
}
