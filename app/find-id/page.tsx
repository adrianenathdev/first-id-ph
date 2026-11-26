import type { Metadata } from 'next'
import { getEntries } from '../../lib/ids'
import { walkthroughs } from '../../lib/walkthroughs'
import Finder from './finder'

export const metadata: Metadata = { title: 'Find my first ID' }

export default async function FindIdPage() {
  const entries = await getEntries()
  const guides = entries.flatMap(entry => {
    const walkthrough = walkthroughs[entry.slug]
    return walkthrough ? [{
      slug: entry.slug, name: entry.name, agency: entry.agency, apply: entry.apply,
      processing: walkthrough.processing, delivery: walkthrough.delivery,
    }] : []
  })
  return <section className="wrap section guide consultation finder-page">
    <h1>Find your first ID</h1>
    <p className="intro">Tell us what you need and which documents you already have. We’ll show where you can start.</p>
    <Finder guides={guides} />
  </section>
}
