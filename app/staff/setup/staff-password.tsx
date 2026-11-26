'use client'

import Link from 'next/link'
import FormField from '../../form-field'
import { useEffect, useState, type FormEvent } from 'react'
import { getBrowserClient } from '../../../lib/browser-auth'

export default function StaffPassword() {
  const supabase = getBrowserClient()
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [access, setAccess] = useState<{ userId: string; allowed: boolean }>()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null))
    return () => data.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!supabase || !userId) return
    let active = true
    void supabase.from('profiles').select('role,enabled').eq('user_id', userId).single().then(({ data }) => {
      if (active) setAccess({ userId, allowed: Boolean(data?.enabled && (data.role === 'admin' || data.role === 'consultant')) })
    })
    return () => { active = false }
  }, [supabase, userId])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy || !userId || access?.userId !== userId || !access.allowed) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    if (password !== form.get('confirm')) {
      setError('The passwords must match.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      setError('Could not set your password. Use a different password or request a new reset link.')
    } finally {
      setBusy(false)
    }
  }

  if (done) return <div className="consult-panel"><p>Your password is set.</p><Link className="button button-primary" href="/staff/login">Go to staff sign-in</Link></div>
  if (supabase && (userId === undefined || (userId && access?.userId !== userId))) return <p role="status">Checking your staff access…</p>
  if (!userId || !access?.allowed) return <div className="consult-panel"><p>Open your staff invitation or password reset email to continue.</p><Link className="text-link" href="/staff/login">Back to staff sign-in ↗</Link></div>

  return <form className="consult-panel" onSubmit={save}>
    <FormField label="New password" validate={value => [...value].length < 12 || new TextEncoder().encode(value).length > 72 ? 'Use at least 12 characters and at most 72 bytes.' : undefined}><input name="password" type="password" autoComplete="new-password" placeholder="At least 12 characters" value={newPassword} onChange={event => setNewPassword(event.currentTarget.value)} minLength={12} required /></FormField>
    <FormField label="Confirm password" recheckKey={newPassword} validate={value => value !== newPassword ? 'The passwords must match.' : undefined}><input name="confirm" type="password" autoComplete="new-password" placeholder="Enter the same password again" minLength={12} required /></FormField>
    <p>Use at least 12 characters.</p>
    <button className="button button-primary" disabled={busy}>Save password</button>
    {error && <p role="alert">{error}</p>}
  </form>
}
