import type { Metadata } from 'next'
import Link from 'next/link'
import StatusForm from './status-form'

export const metadata: Metadata = { title: 'Track your consultation' }

export default function TrackPage() {
  return <section className="wrap section guide consultation">
    <h1>Track your consultation</h1>
    <p className="intro">Enter the eight-letter code you received after submitting your request.</p>
    <StatusForm />
    <p className="track-new-link"><Link className="text-link" href="/consultation">Start a new consultation request ↗</Link></p>
  </section>
}
