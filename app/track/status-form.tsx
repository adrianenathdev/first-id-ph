'use client'

import { useState, type FormEvent } from 'react'
import FormField from '../form-field'
import { formatMeeting, ticketStages, type TicketStage } from '../../lib/ticket-status'

const progressStages = ['requested', 'claimed', 'contacted', 'scheduled', 'completed'] as const

const nextSteps: Record<TicketStage, string> = {
  requested: 'Your request is in the queue. Check here again after a consultant has picked it up.',
  claimed: 'A consultant has picked up your request. Watch for a message through the contact details you provided.',
  contacted: 'Your consultant has reached out. Check your email or social inbox for their message.',
  scheduled: 'Check the meeting details below and follow the instructions your consultant sent.',
  completed: 'Your consultation is closed. You can submit another request if you need help with a different ID.',
  cancelled: 'This request was cancelled. Submit a new request if you still need help.',
}

export default function StatusForm() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ status: TicketStage; meetingAt: string | null }>()

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const submittedCode = code
    setBusy(true)
    setError('')
    setResult(undefined)
    try {
      const response = await fetch('/api/guest-consultations/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: submittedCode }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not check your status.')
      setResult(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not check your status.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="consult-panel tracking-panel">
    <form onSubmit={check}>
      <FormField label="Tracking code"><input className="tracking-input" value={code} disabled={busy} onChange={event => {
        setCode(event.currentTarget.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8))
        setResult(undefined)
        setError('')
      }} autoCapitalize="characters" autoComplete="off" spellCheck={false} pattern="[A-Z]{8}"
        title="Eight letters" placeholder="e.g. ABCDEFGH" aria-describedby="tracking-hint" required /></FormField>
      <p className="field-hint" id="tracking-hint">Use the code you saved after submitting your request.</p>
      <button className="button button-primary" disabled={busy}>{busy ? 'Checking…' : 'Check status'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div className="tracking-result">
      <div role="status">
        <h2>{result.status === 'requested' ? 'Waiting for a consultant' : ticketStages[result.status]}</h2>
        <p>{nextSteps[result.status]}</p>
        {result.meetingAt && <p><strong>Meeting:</strong> {formatMeeting(result.meetingAt)} PHT</p>}
      </div>
      {result.status !== 'cancelled' && <ol className="tracking-timeline" aria-label="Consultation progress">
        {progressStages.map((status, index) => <li key={status} aria-current={status === result.status ? 'step' : undefined}
          data-complete={index < progressStages.indexOf(result.status as typeof progressStages[number])}>
          <span>{status === 'requested' ? 'Request submitted' : ticketStages[status]}</span>
        </li>)}
      </ol>}
    </div>}
  </div>
}
