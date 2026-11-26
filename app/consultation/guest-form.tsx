'use client'

import Link from 'next/link'
import FormField from '../form-field'
import { readProfile, validContactEmail } from '../../lib/contact-format'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { documentOptions } from '../../lib/client-intake'
import { finderHandoffKey } from '../../lib/id-finder'

type Guide = { slug: string; name: string }
const channels = { email: 'No social profile', facebook: 'Facebook', instagram: 'Instagram' } as const

export default function GuestForm({ guides, privacyVersion, preview }: { guides: Guide[]; privacyVersion: string; preview: boolean }) {
  const [channel, setChannel] = useState<keyof typeof channels>('email')
  const [guide, setGuide] = useState('')
  const [documents, setDocuments] = useState<string[]>([])
  const [none, setNone] = useState(false)
  const [city, setCity] = useState('')
  const [carriedChecklist, setCarriedChecklist] = useState(false)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const picker = useRef<HTMLDialogElement>(null)
  const receipt = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id')
    if (id && guides.some(item => item.slug === id)) setGuide(id)
  }, [guides])

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(finderHandoffKey)
      if (!draft) return
      sessionStorage.removeItem(finderHandoffKey)
      const { documents: selection, none, city } = JSON.parse(draft)
      const validDocuments = Array.isArray(selection)
        ? selection.filter(value => typeof value === 'string' && Object.hasOwn(documentOptions, value))
        : []
      setDocuments(validDocuments)
      setNone(!validDocuments.length && none === true)
      if (typeof city === 'string') setCity(city.slice(0, 100))
      setCarriedChecklist(validDocuments.length > 0 || none === true)
    } catch { /* Continue with the editable form if the draft is invalid or unavailable. */ }
  }, [])

  useEffect(() => {
    if (code) receipt.current?.focus()
  }, [code])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!documents.length && !none) {
      setMessage('Select the documents you have or choose “I don’t have any of these yet.”')
      return
    }
    const { privacyConsent, ...fields } = Object.fromEntries(new FormData(event.currentTarget))
    if (privacyConsent !== 'accepted') {
      setMessage('Review the privacy notice and agree before submitting.')
      return
    }
    setMessage('')
    setBusy(true)
    try {
      const response = await fetch('/api/guest-consultations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, age: Number(fields.age), channel, guide, documents, privacyConsent: true, privacyVersion }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save your request.')
      setCode(result.code)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your request.')
    } finally {
      setBusy(false)
    }
  }

  if (code) return <section className="consult-panel tracking-receipt">
    <h2 ref={receipt} tabIndex={-1}>Request submitted</h2>
    <p>Save this private tracking code. You’ll need it to check your request later.</p>
    <code>{code}</code>
    <div className="tracking-actions">
      <button type="button" className="button button-outline" onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true) }
        catch { setCopied(false); setMessage('Select and copy the tracking code above.') }
      }}>{copied ? 'Copied' : 'Copy code'}</button>
      <Link className="button button-primary" href="/track">Check request status</Link>
    </div>
    <p>The consultant will reach out manually using the contact details you shared.</p>
    {message && <p role="status">{message}</p>}
  </section>

  return <form className="consult-panel guest-consult-form" onSubmit={submit}>
    <h2>Request a consultation</h2>
    <aside className="privacy-notice" aria-label="Consultation privacy">
      <strong>Before you share your details</strong>
      <p>We use your details to review your request and contact you about it. Read the <Link className="text-link" href="/privacy" target="_blank" rel="noopener">consultation privacy notice (opens in a new tab)</Link>.</p>
      {preview && <p><strong>Preview:</strong> Use sample information only.</p>}
    </aside>
    <div className="consult-name-row">
    <FormField label="Full name"><input name="full_name" autoComplete="name" placeholder="e.g. Mika Santos" maxLength={120} required /></FormField>
    <FormField label="Age" validate={value => Number(value) < 18 || Number(value) > 120 ? 'Enter an age between 18 and 120.' : undefined}><input name="age" type="number" inputMode="numeric" placeholder="e.g. 18" min={18} max={120} required /></FormField>
    </div>
    <fieldset className="consult-form-group">
      <legend>Where do you live?</legend>
      <FormField label="Barangay"><input name="barangay" placeholder="e.g. San Isidro" maxLength={100} required /></FormField>
      <div className="staff-identity-fields">
        <FormField label="City or municipality"><input name="city" autoComplete="address-level2" placeholder="e.g. Makati City" value={city} onChange={event => setCity(event.target.value)} maxLength={100} required /></FormField>
        <FormField label="Province or Metro Manila"><input name="province" autoComplete="address-level1" placeholder="e.g. Metro Manila" maxLength={100} required /></FormField>
      </div>
    </fieldset>
    <fieldset className="consult-form-group">
      <legend>Contact details</legend>
      <FormField label="Email address" validate={value => validContactEmail(value) ? undefined : 'Use an address like mika@example.com.'}><input name="email" type="email" autoComplete="email" placeholder="e.g. mika@example.com" maxLength={254} required /></FormField>
      <fieldset>
        <legend>Social profile (optional)</legend>
        <p>You can share one Facebook or Instagram profile.</p>
        <div className="filter-options">{(Object.keys(channels) as (keyof typeof channels)[]).map(key => <label key={key}>
          <input type="radio" name="channel-choice" checked={channel === key} onChange={() => setChannel(key)} />{channels[key]}
        </label>)}</div>
        {channel !== 'email' && <FormField key={channel} label={`${channels[channel]} profile link`}
          validate={value => readProfile(value.trim(), channel) ? undefined : `Enter a valid ${channels[channel]} profile link.`}>
          <input name="socialProfile" type="url" autoComplete="url" placeholder={channel === 'facebook' ? 'https://www.facebook.com/yourname' : 'https://www.instagram.com/yourname/'} maxLength={254} required />
        </FormField>}
      </fieldset>
    </fieldset>
    <fieldset className="consult-form-group">
      <legend>Which documents do you already have?</legend>
      <p className="field-hint">{documents.length ? `${documents.length} selected` : 'Select all that apply.'}</p>
      {carriedChecklist && <p role="status">We’ve filled in your selections from the ID finder. You can edit them here.</p>}
      <div className="intake-checklist">{Object.entries(documentOptions).map(([key, label]) => <label key={key}>
        <input type="checkbox" checked={documents.includes(key)} onChange={event => {
          setNone(false)
          const checked = event.currentTarget.checked
          setDocuments(items => checked ? [...items, key] : items.filter(item => item !== key))
        }} /><span>{label}</span>
      </label>)}
      <label><input type="checkbox" checked={none} onChange={event => { setNone(event.target.checked); if (event.target.checked) setDocuments([]) }} /><span>I don’t have any of these yet</span></label></div>
    </fieldset>
    <div className="guide-field">
      <span id="guest-guide">Which ID do you need help with?</span>
      <button type="button" className="button button-outline guide-trigger" aria-haspopup="dialog" aria-labelledby="guest-guide guest-guide-value" onClick={() => picker.current?.showModal()}>
        <span id="guest-guide-value">{guides.find(item => item.slug === guide)?.name ?? 'I’m not sure yet'}</span><span aria-hidden="true">→</span>
      </button>
    </div>
    <dialog ref={picker} className="site-dialog" aria-labelledby="guest-guide-picker">
      <div className="dialog-content">
        <div className="dialog-heading"><h2 id="guest-guide-picker">Choose an ID</h2><button type="button" className="icon-button" aria-label="Close ID picker" onClick={() => picker.current?.close()}>×</button></div>
        <div className="guide-options">{[{ slug: '', name: 'I’m not sure yet' }, ...guides].map(item => <button key={item.slug} type="button"
          className="button button-outline" aria-pressed={guide === item.slug} onClick={() => { setGuide(item.slug); picker.current?.close() }}>{item.name}</button>)}</div>
      </div>
    </dialog>
    <FormField label="What would you like help with?"><textarea name="question" rows={4} maxLength={800}
      placeholder="For example, I have a birth certificate but no photo ID. What can I apply for?" required /></FormField>
    <p>Keep ID numbers and document scans out of your request. Only staff handling your request can see your details.</p>
    <div className="privacy-consent">
      <label><input type="checkbox" name="privacyConsent" value="accepted" required />
        <span>I’ve read the consultation privacy notice and agree that First ID PH may use the information I provide to review my request and contact me about it.</span>
      </label>
    </div>
    {message && <p role="alert">{message}</p>}
    <button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit consultation request'}</button>
  </form>
}
