'use client'

import { useState, type FormEvent } from 'react'
import { documentOptions, type ClientIntake, type DocumentKey } from '../../lib/client-intake'
import { getBrowserClient } from '../../lib/browser-auth'

export default function IntakeForm({ email, userId, existing, onSaved, onCancel }: {
  email: string
  userId: string
  existing: ClientIntake | null
  onSaved: (intake: ClientIntake) => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<DocumentKey[]>(existing?.documents ?? [])
  const [noDocuments, setNoDocuments] = useState(Boolean(existing && existing.documents.length === 0))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserClient()
    if (!supabase || busy) return
    setError('')
    if (!selected.length && !noDocuments) {
      setError('Select the documents you have or choose “I don’t have any of these yet.”')
      return
    }
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    const intake = {
      full_name: field('full_name'), age: Number(field('age')), barangay: field('barangay'),
      city: field('city'), province: field('province'), documents: selected,
    }
    if (!intake.full_name || !intake.barangay || !intake.city || !intake.province) {
      setError('Enter your name and all three parts of your location.')
      return
    }
    setBusy(true)
    try {
      const request = existing
        ? supabase.from('client_intake').update(intake).eq('user_id', userId)
        : supabase.from('client_intake').insert({ ...intake, user_id: userId })
      const { data, error } = await request.select('user_id').single()
      if (error || !data) throw error
      onSaved(intake)
    } catch {
      setError('We couldn’t save your checklist. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <form className="consult-panel" onSubmit={save}>
    <h2>Tell us about yourself</h2>
    <p>Your intake helps the consultant check which ID options are available to you. Only the assigned consultant and First ID PH admins can view it with your ticket.</p>
    <label>Full name<input name="full_name" placeholder="e.g. Mika Santos" autoComplete="name" maxLength={120} defaultValue={existing?.full_name} required /></label>
    <div className="staff-identity-fields">
      <label>Email address<input type="email" autoComplete="email" value={email} readOnly /></label>
      <label>Age<input name="age" placeholder="e.g. 18" type="number" min={18} max={120} defaultValue={existing?.age} required /></label>
    </div>
    <fieldset>
      <legend>Where do you live?</legend>
      <label>Barangay<input name="barangay" placeholder="e.g. San Isidro" maxLength={100} defaultValue={existing?.barangay} required /></label>
      <div className="staff-identity-fields">
        <label>City or municipality<input name="city" placeholder="e.g. Makati City" autoComplete="address-level2" maxLength={100} defaultValue={existing?.city} required /></label>
        <label>Province or Metro Manila<input name="province" placeholder="e.g. Metro Manila" autoComplete="address-level1" maxLength={100} defaultValue={existing?.province} required /></label>
      </div>
    </fieldset>
    <fieldset>
      <legend>Which documents do you already have?</legend>
      <p>Select all that apply. Leave out ID numbers and scans.</p>
      <div className="intake-checklist">{(Object.keys(documentOptions) as DocumentKey[]).map(key => <label key={key}>
        <input type="checkbox" checked={selected.includes(key)} onChange={event => {
          setNoDocuments(false)
          setSelected(event.target.checked ? [...selected, key] : selected.filter(item => item !== key))
        }} />
        <span>{documentOptions[key]}</span>
      </label>)}
      <label><input type="checkbox" checked={noDocuments} onChange={event => {
        setNoDocuments(event.target.checked)
        if (event.target.checked) setSelected([])
      }} /><span>I don’t have any of these yet</span></label></div>
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <div className="dialog-actions">
      {existing && <button type="button" className="button button-outline" disabled={busy} onClick={onCancel}>Cancel</button>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : existing ? 'Save checklist' : 'Save and continue'}</button>
    </div>
  </form>
}
