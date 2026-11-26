'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import type { Entry } from '../lib/ids'
import { effortLabels } from '../lib/effort'

const orders = { easiest: 'Easiest to hardest', agency: 'Guide order' }
type Filters = { category: string; sort: keyof typeof orders }
const defaults: Filters = { category: 'All', sort: 'easiest' }

export default function Directory({ entries, effortBySlug }: { entries: Entry[]; effortBySlug: Record<string, number> }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(defaults)
  const [draft, setDraft] = useState(defaults)
  const dialog = useRef<HTMLDialogElement>(null)
  const categories = ['All', ...new Set(entries.map(entry => entry.category))]
  const term = query.trim().toLowerCase()
  const matches = entries.filter(entry =>
    (filters.category === 'All' || entry.category === filters.category) &&
    [entry.name, entry.agency, entry.summary, entry.category].some(value => value.toLowerCase().includes(term))
  )
  if (filters.sort === 'easiest') matches.sort((a, b) => (effortBySlug[a.slug] ?? 6) - (effortBySlug[b.slug] ?? 6))
  const active = filters.category !== defaults.category || filters.sort !== defaults.sort

  function openFilters() {
    setDraft(filters)
    dialog.current?.showModal()
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    setFilters(draft)
    dialog.current?.close()
  }

  return <>
    <div className="directory-tools">
      <label>Search IDs<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try passport or PhilHealth" /></label>
      <button type="button" className="button button-outline" aria-haspopup="dialog" onClick={openFilters}>
        <span className="filter-icon" aria-hidden="true"><i /><i /><i /></span> Filters &amp; sort
      </button>
    </div>
    <dialog ref={dialog} className="site-dialog" aria-labelledby="filters-title">
      <form onSubmit={applyFilters}>
        <div className="dialog-heading"><h2 id="filters-title">Filters &amp; sort</h2><button autoFocus className="icon-button" type="button" onClick={() => dialog.current?.close()} aria-label="Close filters">×</button></div>
        <fieldset><legend>Category</legend><div className="filter-options">{categories.map(category => <label key={category}>
          <input type="radio" name="category" value={category} checked={draft.category === category} onChange={() => setDraft({ ...draft, category })} />
          <span>{category === 'All' ? 'All categories' : category}</span>
        </label>)}</div></fieldset>
        <fieldset><legend>Sort by</legend><div className="filter-options">{(Object.keys(orders) as Filters['sort'][]).map(sort => <label key={sort}>
          <input type="radio" name="sort" value={sort} checked={draft.sort === sort} onChange={() => setDraft({ ...draft, sort })} />
          <span>{orders[sort]}</span>
        </label>)}</div></fieldset>
        <div className="dialog-actions"><button type="button" className="button button-outline" onClick={() => setDraft(defaults)}>Reset filters</button><button className="button button-primary">Apply filters <span aria-hidden="true">→</span></button></div>
      </form>
    </dialog>
    <div className="directory-status">
      <p aria-live="polite">{matches.length} {matches.length === 1 ? 'result' : 'results'} <span>· {orders[filters.sort]}</span>{filters.category !== 'All' && <span> · {filters.category}</span>}</p>
      {active && <button type="button" className="text-link" onClick={() => setFilters(defaults)}>Clear filters</button>}
    </div>
    <p className="ranking-note">Ranked by application effort, including documents, visits and eligibility. Timing and eligibility vary by applicant.</p>
    <div className="grid directory-grid">{matches.map(entry => {
      const effort = effortBySlug[entry.slug]
      return <article className="card" key={entry.slug}>
        <Link className="card-link" href={`/ids/${entry.slug}`} aria-label={`See requirements for ${entry.name}`}>
          <p className="card-agency">{entry.agency}</p>
          <h3>{entry.name}</h3>
          <p className="card-summary">{entry.summary}</p>
          <div className="card-footer">
            {effort ? <div className="card-effort">
              <span className="card-meter" aria-hidden="true">{Array.from({ length: 5 }, (_, index) =>
                <i key={index} data-filled={index < effort} />
              )}</span>
              <span>{effortLabels[effort]} · {effort}/5</span>
            </div> : <span className="card-category">{entry.category}</span>}
            <span className="card-arrow" aria-hidden="true">→</span>
          </div>
        </Link>
      </article>
    })}</div>
    {!matches.length && <div className="empty-results"><h3>No matching guides</h3><p>Try a different search or choose another category.</p><button type="button" className="button button-outline" onClick={() => { setQuery(''); setFilters(defaults) }}>Show all guides</button></div>}
  </>
}
