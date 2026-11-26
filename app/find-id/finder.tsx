'use client'

import Link from 'next/link'
import FormField from '../form-field'
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { documentOptions, type DocumentKey } from '../../lib/client-intake'
import { finderHandoffKey, findIdRoutes, idFinderGoals, type FinderGoal } from '../../lib/id-finder'

type Guide = { slug: string; name: string; agency: string; apply: string; processing: string; delivery: string }

const steps = ['Your goal', 'Your documents', 'Your options']
const statusLabels = { ready: 'You can start here', missing: 'Gather these first', check: 'Confirm with the agency' }

export default function Finder({ guides }: { guides: Guide[] }) {
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<FinderGoal>('first')
  const [documents, setDocuments] = useState<DocumentKey[]>([])
  const [none, setNone] = useState(false)
  const [city, setCity] = useState('')
  const [psaBirthCertificate, setPsaBirthCertificate] = useState(false)
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const hasMoved = useRef(false)
  const results = step === 2 ? findIdRoutes(goal, documents, goal === 'local' ? city.trim() : '', psaBirthCertificate && documents.includes('birth-certificate')) : []

  useEffect(() => {
    if (hasMoved.current) heading.current?.focus()
  }, [step])

  function goTo(next: number) {
    hasMoved.current = true
    setError('')
    setStep(next)
  }

  function next(event: FormEvent) {
    event.preventDefault()
    if (step === 1 && !documents.length && !none) {
      setError('Choose the documents you have or select “I don’t have any of these yet.”')
      return
    }
    goTo(step + 1)
  }

  function shareChecklist(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) return
    try { sessionStorage.setItem(finderHandoffKey, JSON.stringify({ documents, none, city: goal === 'local' ? city.trim() : '' })) }
    catch { /* The consultation form still opens if browser storage is unavailable. */ }
  }

  return <>
    <ol className="finder-steps" aria-label="Finder progress">
      {steps.map((name, index) => <li key={name} aria-current={step === index ? 'step' : undefined}><span>{index + 1}</span>{name}</li>)}
    </ol>
    {step < 2 ? <form className="consult-panel" onSubmit={next}>
      <h2 ref={heading} tabIndex={-1}>{step === 0 ? 'What do you need the ID for?' : 'What do you already have?'}</h2>
      {step === 0 ? <fieldset className="finder-goals">
        <legend className="sr-only">Choose your goal</legend>
        {(Object.keys(idFinderGoals) as FinderGoal[]).map(key => <label key={key}>
          <input type="radio" name="goal" checked={goal === key} onChange={() => setGoal(key)} />
          <span>{idFinderGoals[key]}</span>
        </label>)}
      </fieldset> : <>
        <fieldset><legend>Choose all the documents you have</legend>
          <div className="intake-checklist">{(Object.keys(documentOptions) as DocumentKey[]).map(key => <label key={key}>
            <input type="checkbox" checked={documents.includes(key)} onChange={event => {
              const checked = event.currentTarget.checked
              setNone(false)
              setDocuments(items => checked ? [...items, key] : items.filter(item => item !== key))
            }} /><span>{documentOptions[key]}</span>
          </label>)}
          <label><input type="checkbox" checked={none} onChange={event => {
            setNone(event.currentTarget.checked)
            if (event.currentTarget.checked) setDocuments([])
          }} /><span>I don’t have any of these yet</span></label></div>
        </fieldset>
        {documents.includes('birth-certificate') && <div className="intake-checklist finder-birth-option"><label>
          <input type="checkbox" checked={psaBirthCertificate} onChange={event => setPsaBirthCertificate(event.currentTarget.checked)} />
          <span>My birth certificate was issued by the PSA</span>
        </label></div>}
        {goal === 'local' && <FormField label="City or municipality (optional)"><input value={city} onChange={event => setCity(event.target.value)} placeholder="e.g. Makati City" maxLength={100} /></FormField>}
      </>}
      {error && <p role="alert">{error}</p>}
      <div className="dialog-actions">
        {step > 0 && <button type="button" className="button button-outline" onClick={() => goTo(step - 1)}>Back</button>}
        <button type="submit" className="button button-primary">{step === 0 ? 'Continue' : 'Show my options'} <span aria-hidden="true">→</span></button>
      </div>
    </form> : <section className="finder-results">
      <div className="staff-toolbar">
        <h2 ref={heading} tabIndex={-1}>Your ID options</h2>
        <button type="button" className="button button-outline" onClick={() => goTo(1)}>Edit answers</button>
      </div>
      <p>These routes are based on the documents you selected. Confirm the agency’s full requirements before applying.</p>
      <div className="finder-results-list">{results.map(result => {
        const guide = guides.find(item => item.slug === result.slug)
        if (!guide) return null
        return <article className="consult-panel finder-result" key={result.slug}>
          <span className="effort" data-ready={result.state === 'ready'}>{statusLabels[result.state]}</span>
          <h3>{result.label ?? guide.name}</h3>
          <p>{result.nextStep}</p>
          {result.missing.length > 0 && <><strong>Documents to prepare</strong><ul>{result.missing.map(item => <li key={item}>{item}</li>)}</ul></>}
          <dl className="timing">
            <div><dt>Processing</dt><dd>{guide.processing}</dd></div>
            <div><dt>Delivery or pickup</dt><dd>{guide.delivery}</dd></div>
          </dl>
          <div className="tracking-actions">
            <Link className="button button-outline" href={`/ids/${guide.slug}`}>Read walkthrough</Link>
            <a className="text-link" href={guide.apply}>{guide.agency} website ↗</a>
          </div>
        </article>
      })}</div>
      <div className="consult-panel">
        <h3>Need help choosing a route?</h3>
        <p>Ask for one-on-one guidance. Your document selections will carry over to the consultation form.</p>
        <Link href="/consultation" className="button button-primary" onClick={shareChecklist}>Request a consultation ↗</Link>
      </div>
    </section>}
  </>
}
