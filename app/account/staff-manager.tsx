'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import FormField from '../form-field'
import { validContactEmail } from '../../lib/contact-format'
import StaffPagination from './staff-pagination'

type Consultant = { user_id: string; email: string; fullName: string; nickname: string; enabled: boolean; confirmed: boolean }

async function loadStaff(token: string, page: number, pendingOnly: boolean) {
  const response = await fetch(`/api/staff?page=${page}&pending=${pendingOnly}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'Could not load consultants.')
  return result as { staff: Consultant[]; hasMore: boolean }
}

export default function StaffManager({ token, pendingOnly }: { token: string; pendingOnly: boolean }) {
  const [staff, setStaff] = useState<Consultant[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const inviteDialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    let active = true
    loadStaff(token, page, pendingOnly).then(result => {
      if (!active) return
      if (page > 1 && result.staff.length === 0) {
        setPage(page - 1)
        return
      }
      setStaff(result.staff)
      setHasMore(result.hasMore)
    }).catch(error => {
      if (active) {
        setStaff([])
        setHasMore(false)
        setMessage(error.message)
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, page, version, pendingOnly])

  async function update(method: 'POST' | 'PATCH', body: object, success: string) {
    if (busy) return false
    setBusy(true)
    if (method === 'POST') setInviteMessage('')
    else setMessage('')
    try {
      const response = await fetch('/api/staff', {
        method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'The account could not be updated.')
      setMessage(success)
      setLoading(true)
      setVersion(value => value + 1)
      return true
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The account could not be updated.'
      if (method === 'POST') setInviteMessage(detail)
      else setMessage(detail)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const account = Object.fromEntries(fields)
    if (await update('POST', account, 'Invitation sent. Share the initial password with the consultant separately.')) {
      form.reset()
      inviteDialog.current?.close()
      setPage(1)
    }
  }

  return <div className="consult-panel">
    <div className="staff-toolbar">
      <h2>{pendingOnly ? 'Pending invitations' : 'Manage consultants'}</h2>
      <button type="button" className="button button-primary" aria-haspopup="dialog" disabled={busy} onClick={() => {
        setInviteMessage('')
        inviteDialog.current?.showModal()
      }}><span aria-hidden="true">+</span> Add consultant</button>
    </div>
    <dialog ref={inviteDialog} className="site-dialog" aria-labelledby="invite-title"
      onCancel={event => { if (busy) event.preventDefault() }}
      onClose={() => inviteDialog.current?.querySelector('form')?.reset()}>
      <form onSubmit={invite}>
        <div className="dialog-heading">
          <h2 id="invite-title">Add consultant</h2>
          <button className="icon-button" type="button" disabled={busy} onClick={() => inviteDialog.current?.close()} aria-label="Close invitation">×</button>
        </div>
        <div className="staff-identity-fields">
          <FormField label="Full name"><input name="fullName" placeholder="e.g. Mika Santos" maxLength={120} required autoFocus /></FormField>
          <FormField label="Nickname"><input name="nickname" placeholder="e.g. Mika" maxLength={40} required /></FormField>
        </div>
        <FormField label="Email address" validate={value => validContactEmail(value) ? undefined : 'Use an address like mika@example.com.'}><input type="email" name="email" placeholder="e.g. mika@example.com" maxLength={254} required /></FormField>
        <FormField label="Initial password" validate={value => [...value].length < 12 || new TextEncoder().encode(value).length > 72 ? 'Use at least 12 characters and at most 72 bytes.' : undefined}><input type="password" name="password" autoComplete="new-password" placeholder="At least 12 characters" minLength={12} required /></FormField>
        <p>Use at least 12 characters. Share the initial password separately from the invitation email.</p>
        {inviteMessage && <p role="alert">{inviteMessage}</p>}
        <div className="dialog-actions">
          <button className="button button-outline" type="button" disabled={busy} onClick={() => inviteDialog.current?.close()}>Cancel</button>
          <button className="button button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
        </div>
      </form>
    </dialog>
    {loading ? <p role="status">Loading consultants…</p> : staff.length > 0 ? <div className="staff-table-wrap"><table className="staff-table">
      <thead><tr><th scope="col">Consultant</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead>
      <tbody>{staff.map(person => {
        const status = !person.enabled ? 'Disabled' : person.confirmed ? 'Active' : 'Pending invitation'
        return <tr key={person.user_id}>
          <th scope="row"><strong>{person.nickname || person.fullName || person.email}</strong>{(person.nickname || person.fullName) && <span>{[person.fullName !== person.nickname ? person.fullName : null, person.email].filter(Boolean).join(' · ')}</span>}</th>
          <td><span className="staff-status" data-active={person.enabled && person.confirmed}>{status}</span></td>
          <td><button className="button button-outline" disabled={busy} type="button" aria-label={`${person.enabled ? 'Disable' : 'Enable'} ${person.email}`}
            onClick={() => void update('PATCH', { userId: person.user_id, enabled: !person.enabled }, person.enabled ? 'Consultant disabled.' : 'Consultant enabled.')}>
            {person.enabled ? 'Disable' : 'Enable'}
          </button></td>
        </tr>
      })}</tbody>
      </table></div> : <div className="staff-empty"><p>{pendingOnly ? 'No pending invitations.' : 'No consultants to display.'}</p></div>}
    <StaffPagination page={page} hasMore={hasMore} loading={loading || busy} onChange={next => { setLoading(true); setPage(next) }} />
    <p role="status">{message}</p>
  </div>
}
