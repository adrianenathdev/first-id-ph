import type { Metadata } from 'next'
import Consultation from '../consultation/request-form'
import { getEntries } from '../../lib/ids'

export const metadata: Metadata = { title: 'Client dashboard', robots: { index: false } }

export default async function ClientDashboardPage() {
  const entries = await getEntries()
  return <section className="wrap section guide consultation">
    <h1>Client dashboard</h1>
    <p className="intro">Update your checklist, request a consultation, and track your progress.</p>
    <Consultation dashboard guides={entries.map(({ slug, name }) => ({ slug, name }))} />
  </section>
}
