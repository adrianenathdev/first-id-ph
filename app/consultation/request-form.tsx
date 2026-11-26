'use client'

import type { Session } from '@supabase/supabase-js'
import FormField from '../form-field'
import { useRouter } from 'next/navigation'
import type { ClientIntake } from '../../lib/client-intake'
import IntakeForm from './intake-form'
import { getBrowserClient } from '../../lib/browser-auth'
import { formatMeeting, ticketStages, type TicketStage } from '../../lib/ticket-status'
import { useEffect, useRef, useState, type FormEvent } from 'react'

type Request = { id: string; guide_slug: string | null; status: TicketStage; preferred_day: string | null; meeting_at: string | null }
type Guide = { slug: string; name: string }

export default function Consultation({ guides, dashboard = false }: { guides: Guide[]; dashboard?: boolean }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [history, setHistory] = useState<{ userId: string; requests: Request[]; error: boolean }>()
  const [intakeResult, setIntakeResult] = useState<{ userId: string; data: ClientIntake | null; error?: string }>()
  const [editingIntake, setEditingIntake] = useState(false)
  const [intakeVersion, setIntakeVersion] = useState(0)
  const [requestVersion, setRequestVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState('')
  const guideDialog = useRef<HTMLDialogElement>(null)
  const supabase = getBrowserClient()
  const router = useRouter()
  const userId = session?.user.id
  const intake = intakeResult?.userId === userId ? intakeResult : undefined
  const activeHistory = history?.userId === userId ? history : undefined
  const requests = activeHistory?.requests ?? []

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!supabase || !userId || !dashboard) return
    let active = true
    void supabase.from('consultation_requests').select('id,guide_slug,status,preferred_day,meeting_at')
      .order('created_at', { ascending: false }).then(({ data, error }) => {
        if (!active) return
        setHistory({ userId, requests: data ?? [], error: Boolean(error) })
      })
    return () => { active = false }
  }, [supabase, userId, requestVersion, dashboard])

  useEffect(() => {
    if (!supabase || !userId || !dashboard) return
    let active = true
    void Promise.all([
      supabase.from('profiles').select('role,enabled').eq('user_id', userId).single(),
      supabase.from('client_intake').select('full_name,age,barangay,city,province,documents').eq('user_id', userId).maybeSingle(),
    ]).then(([profile, response]) => {
      if (!active) return
      const error = profile.error || response.error ? 'We couldn’t load your client checklist.'
        : profile.data?.role !== 'client' || !profile.data.enabled ? 'Sign in with an active client account to request a consultation.' : undefined
      setIntakeResult({ userId, data: response.data as ClientIntake | null, error })
    })
    return () => { active = false }
  }, [supabase, userId, intakeVersion, dashboard])

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('id')
    if (guides.some(guide => guide.slug === slug)) setSelectedGuide(slug!)
  }, [guides])

  const destination = supabase && session !== undefined
    ? dashboard && !session ? '/consultation' : !dashboard && session ? '/dashboard' : undefined
    : undefined

  useEffect(() => {
    if (destination) router.replace(destination + window.location.search)
  }, [destination, router])

  async function sendLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setMessage('')
    const email = String(new FormData(event.currentTarget).get('email')).trim()
    const redirect = new URL('/consultation', window.location.origin)
    const requestedGuide = new URLSearchParams(window.location.search).get('id')
    if (requestedGuide) redirect.searchParams.set('id', requestedGuide)
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect.href } })
      if (error) throw error
      setFailed(false)
      setMessage('Check your inbox for a link to create your account or sign in.')
    } catch {
      setFailed(true)
      setMessage('The sign-in link could not be sent. Check your email address and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !userId || !intake?.data || busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.from('consultation_requests').insert({
        guide_slug: selectedGuide || null,
        preferred_day: fields.get('day') || null,
        question: String(fields.get('question')).trim(),
      })
      if (error) throw error
      form.reset()
      setSelectedGuide('')
      setRequestVersion(version => version + 1)
      setFailed(false)
      setMessage('Request sent. The team will email you to arrange a time.')
    } catch {
      setFailed(true)
      setMessage('Your request could not be sent. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (!supabase || busy) return
    setBusy(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setHistory(undefined)
      setIntakeResult(undefined)
      setEditingIntake(false)
    } catch {
      setFailed(true)
      setMessage('Could not sign out. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!supabase) return <div className="consult-panel"><h2>Consultations are coming soon</h2><p>In the meantime, browse the ID guides to check requirements and application links.</p><a className="text-link" href="/#directory">Browse the ID directory ↗</a></div>
  if (destination || session === undefined) return <p role="status">Checking your sign-in…</p>

  return <>
    {session ? <>
      {!intake ? <p role="status">Loading your checklist…</p> : intake.error ? <div className="consult-panel">
        <p role="alert">{intake.error}</p>
        <button type="button" className="button button-outline" onClick={() => { setIntakeResult(undefined); setIntakeVersion(version => version + 1) }}>Try again</button>
      </div> : !intake.data || editingIntake ? <IntakeForm key={session.user.id} email={session.user.email ?? ''} userId={session.user.id} existing={intake.data}
        onSaved={data => { setIntakeResult({ userId: session.user.id, data }); setEditingIntake(false) }}
        onCancel={() => setEditingIntake(false)} /> : <form className="consult-panel" onSubmit={sendRequest}>
        <div className="staff-toolbar"><h2>Request a consultation</h2>
          <button type="button" className="button button-outline" onClick={() => setEditingIntake(true)}>Edit checklist</button>
        </div>
        <div className="guide-field">
          <span id="guide-label">Which ID do you need?</span>
          <button type="button" className="button button-outline guide-trigger" aria-haspopup="dialog" aria-labelledby="guide-label guide-value" onClick={() => guideDialog.current?.showModal()}>
            <span id="guide-value">{guides.find(guide => guide.slug === selectedGuide)?.name ?? 'I’m not sure yet'}</span><span aria-hidden="true">→</span>
          </button>
        </div>
        <dialog ref={guideDialog} className="site-dialog" aria-labelledby="guide-picker-title">
          <div className="dialog-content">
            <div className="dialog-heading"><h2 id="guide-picker-title">Choose an ID</h2><button autoFocus type="button" className="icon-button" aria-label="Close ID picker" onClick={() => guideDialog.current?.close()}>×</button></div>
            <div className="guide-options">{[{ slug: '', name: 'I’m not sure yet' }, ...guides].map(guide => <button key={guide.slug} type="button"
              className="button button-outline" aria-pressed={selectedGuide === guide.slug}
              onClick={() => { setSelectedGuide(guide.slug); guideDialog.current?.close() }}>{guide.name}</button>)}</div>
          </div>
        </dialog>
        <FormField label="Preferred day in Philippine time (optional)" hint="Example: 5 December."><input type="date" name="day" /></FormField>
        <label>What would you like help with?<textarea name="question" rows={4} maxLength={800} required placeholder="For example, I have a PSA birth certificate but no photo ID." /></label>
        <p>Please keep ID numbers and document images out of your request.</p>
        <button className="button" disabled={busy}>Send request</button>
      </form>}
      <div className="consult-panel">
        <h2>Your requests</h2>
        {!activeHistory ? <p role="status">Loading your requests…</p> : activeHistory.error ? <p>Request history could not be loaded.</p> : requests.length ? <ul>{requests.map(request => <li key={request.id}>
          <strong>{guides.find(guide => guide.slug === request.guide_slug)?.name ?? 'General guidance'}</strong>
          {' · '}{ticketStages[request.status]}{request.preferred_day && ` · Preferred date ${request.preferred_day}`}{request.meeting_at && ` · Meeting ${formatMeeting(request.meeting_at)} PHT`}
        </li>)}</ul> : <p>No requests yet.</p>}
        <button className="text-link" type="button" disabled={busy} onClick={signOut}>Sign out</button>
      </div>
    </> : <form className="consult-panel" onSubmit={sendLink}>
      <h2>Sign up or sign in</h2>
      <p>Enter your email to get a secure link. After signing in, complete a short checklist before booking a consultation.</p>
      <label>Email address<input type="email" name="email" autoComplete="email" placeholder="e.g. mika@example.com" required /></label>
      <button className="button" disabled={busy}>Email me a sign-in link</button>
    </form>}
    <p role={failed ? 'alert' : 'status'}>{message}</p>
  </>
}
