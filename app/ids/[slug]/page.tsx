import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEntries } from '../../../lib/ids'
import { cache } from 'react'
import { walkthroughs } from '../../../lib/walkthroughs'
import { effortLabels } from '../../../lib/effort'

export const revalidate = 3600
type Props = { params: Promise<{ slug: string }> }
const findEntry = cache(async (slug: string) => (await getEntries()).find(entry => entry.slug === slug))

export async function generateMetadata({ params }: Props) {
  const entry = await findEntry((await params).slug)
  return entry ? { title: entry.name, description: entry.summary } : {}
}

export default async function Guide({ params }: Props) {
  const entry = await findEntry((await params).slug)
  if (!entry) notFound()
  const walkthrough = walkthroughs[entry.slug]
  return <article className="wrap section guide">
    <Link className="text-link" href="/#directory">← Back to the directory</Link>
    <p className="eyebrow">{entry.agency} · {entry.category}</p>
    <h1>{entry.name}</h1><p className="intro">{entry.summary}</p>
    {walkthrough?.effort && <span className="effort">Application effort {walkthrough.effort}/5 · {effortLabels[walkthrough.effort]}</span>}
    {walkthrough && <>
      <h2>What if I only have one ID?</h2>
      <p>{walkthrough.options}</p>
      <h2>How to apply</h2>
      <ol className="walkthrough">{walkthrough.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <h2>Processing and delivery</h2>
      <dl className="timing">
        <div><dt>Processing</dt><dd>{walkthrough.processing}</dd></div>
        <div><dt>Delivery or pickup</dt><dd>{walkthrough.delivery}</dd></div>
      </dl>
      {walkthrough.timingSource && <p><a className="text-link" href={walkthrough.timingSource}>Read the agency’s published guidance ↗</a></p>}
    </>}
    <h2>What to bring</h2><ul>{entry.bring.map(requirement => <li key={requirement}>{requirement}</li>)}</ul>
    <h2>Where to apply</h2><a className="button" href={entry.apply}>Open official website ↗</a>
    <p><a className="text-link" href={entry.source}>Read the agency’s requirements ↗</a></p>
    <h2>Need help with this ID?</h2><Link className="text-link" href={`/consultation?id=${entry.slug}`}>Request a one-on-one consultation ↗</Link>
  </article>
}
