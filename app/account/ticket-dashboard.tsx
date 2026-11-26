'use client'

import { useEffect, useState, type FormEvent } from 'react'
import FormField from '../form-field'
import StaffPagination from './staff-pagination'
import { documentOptions, type ClientIntake } from '../../lib/client-intake'
import { formatMeeting, ticketStages, type TicketStage } from '../../lib/ticket-status'

type Ticket = {
  id: string
  guideName: string | null
  status: TicketStage
  created_at: string
  preferred_day: string | null
  meeting_at: string | null
  claimed_at: string | null
  contacted_at: string | null
  closed_at: string | null
  question: string | null
  contactEmail: string | null
  contactChannel: string | null
  contactProfile: string | null
  clientIntake: ClientIntake | null
  consultant: string | null
  assignedToMe: boolean
}

const actions = {
  requested: ['claim', 'Claim ticket'],
  claimed: ['contact', 'Mark reached out'],
  contacted: ['schedule', 'Schedule meeting'],
  scheduled: ['close', 'Close ticket'],
} as const

export default function TicketDashboard({ token, admin, stage }: { token: string; admin: boolean; stage: TicketStage | '' }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  function refresh() {
    setLoading(true)
    setVersion(value => value + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), stage })
    void (async () => {
      try {
        const response = await fetch('/api/tickets?' + params, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Could not load tickets.')
        setTickets(result.tickets)
        setHasMore(result.hasMore)
      } catch (error) {
        if (controller.signal.aborted) return
        setTickets([])
        setHasMore(false)
        setMessage(error instanceof Error ? error.message : 'Could not load tickets.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [page, stage, version, token])

  async function advance(event: FormEvent<HTMLFormElement>, id: string, action: string) {
    event.preventDefault()
    if (busy) return
    const meeting = new FormData(event.currentTarget).get('meeting')
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, meeting }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not update the ticket.')
      setMessage('Ticket updated.')
      refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the ticket.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="consult-panel">
    <div className="staff-toolbar">
      <h2>{stage ? ticketStages[stage] : admin ? 'Client consultation progress' : 'Consultation queue'}</h2>
      <button type="button" className="button button-outline" disabled={loading || busy} onClick={refresh}>Refresh</button>
    </div>
    <p role="status">{message}</p>
    {loading ? <p role="status">Loading tickets…</p> : tickets.length ? <div className="ticket-list">
      {tickets.map(ticket => {
        const action = ticket.status in actions && !admin && (ticket.status === 'requested' || ticket.assignedToMe)
          ? actions[ticket.status as keyof typeof actions] : undefined
        return <article className="ticket-card" key={ticket.id}>
          <div className="staff-toolbar"><h3>{ticket.guideName || 'General ID guidance'}</h3><span className="effort">{ticketStages[ticket.status]}</span></div>
          <p className="ticket-reference">#{ticket.id.slice(0, 8)} · Submitted {formatMeeting(ticket.created_at)} PHT</p>
          {ticket.consultant && <p>Consultant: {ticket.consultant}</p>}
          {ticket.preferred_day && <p>Preferred day: {ticket.preferred_day}</p>}
          {ticket.clientIntake && <details className="ticket-intake">
            <summary>Client details and document checklist</summary>
            <dl>
              <div><dt>Name</dt><dd>{ticket.clientIntake.full_name}</dd></div>
              <div><dt>Age</dt><dd>{ticket.clientIntake.age}</dd></div>
              <div><dt>Address</dt><dd>{[ticket.clientIntake.barangay, ticket.clientIntake.city, ticket.clientIntake.province].join(', ')}</dd></div>
            </dl>
            <p><strong>Documents on hand</strong></p>
            {ticket.clientIntake.documents.length ? <ul>{ticket.clientIntake.documents.map((key, index) => <li key={key + index}>{documentOptions[key]}</li>)}</ul> : <p>No documents selected.</p>}
          </details>}
          {ticket.question && <p className="ticket-question">{ticket.question}</p>}
          {ticket.contactEmail && <p className="ticket-question"><strong>Client email:</strong> {ticket.contactEmail}</p>}
          {ticket.contactProfile && <p className="ticket-question"><strong>{ticket.contactChannel === 'facebook' ? 'Facebook' : 'Instagram'} profile:</strong> {ticket.contactProfile}</p>}
          {ticket.meeting_at && <p><strong>Meeting:</strong> {formatMeeting(ticket.meeting_at)} PHT</p>}
          {ticket.closed_at && <p>Closed {formatMeeting(ticket.closed_at)} PHT</p>}
          {action && <form onSubmit={event => void advance(event, ticket.id, action[0])}>
            {action[0] === 'schedule' && <FormField label="Meeting date and time (Philippine time)" hint="Example: 5 December, 2:30 PM." validate={value => new Date(value + ':00+08:00').getTime() <= Date.now() ? 'Choose a future meeting time.' : undefined}><input type="datetime-local" name="meeting" required /></FormField>}
            <button className="button button-primary" disabled={busy}>{action[1]}</button>
          </form>}
        </article>
      })}
    </div> : <p>No tickets in this view.</p>}
    <StaffPagination page={page} hasMore={hasMore} loading={loading || busy} onChange={next => { setLoading(true); setPage(next) }} />
  </section>
}
