import Link from 'next/link'
import Directory from './directory'
import { getEntries } from '../lib/ids'
import { walkthroughs } from '../lib/walkthroughs'

export const revalidate = 3600

export default async function Home() {
  const entries = await getEntries()
  const effortBySlug: Record<string, number> = {}
  for (const { slug } of entries) {
    const effort = walkthroughs[slug]?.effort
    if (effort) effortBySlug[slug] = effort
  }
  return <>
    <section className="hero"><div className="wrap hero-inner"><div>
      <h1>Your first valid ID starts here<span>.</span></h1>
      <p>A guide for adults 18 and older who need a Philippine ID. Find out what you can apply for with the documents you already have.</p>
      <div className="hero-actions">
        <Link className="button" href="/find-id">Find my first ID <span className="button-arrow" aria-hidden="true">→</span></Link>
        <Link className="button button-hero-secondary" href="/consultation">Get one-on-one help <span className="button-arrow" aria-hidden="true">↗</span></Link>
      </div>
    </div><div className="hero-art" aria-hidden="true">
      <div className="id-stage"><div className="id-art">
        <div className="id-face"><span>FIRST ID PH</span><strong>18<span>+</span></strong><i></i><i></i></div>
      </div></div>
    </div></div></section>
    <section className="public-start" id="start"><div className="wrap section start-layout">
      <div className="start-intro">
        <h2>Where should I start?</h2>
        <p>Pick the situation that sounds like yours.</p>
      </div>
      <div className="start-routes">
        <Link href="/find-id" className="start-route">
          <div><h3>I have no valid ID</h3><p>Check which IDs you can apply for with the documents you have.</p></div><span aria-hidden="true">→</span>
        </Link>
        <a href="https://national-id.gov.ph/" className="start-route">
          <div><h3>I already registered for PhilSys</h3><p>Check if your Digital National ID is available.</p></div><span aria-hidden="true">↗</span>
        </a>
        <a href="#next-id" className="start-route">
          <div><h3>I already have one ID</h3><p>See which other applications it can help with.</p></div><span aria-hidden="true">↓</span>
        </a>
      </div>
    </div></section>
    <section className="wrap section next-id" id="next-id">
      <h2>What can I get with the ID I have?</h2>
      <div className="grid paths">
        <article><h3>National ID</h3><p>Explore Postal ID with proof of address, or a passport with your PSA birth certificate.</p><Link className="text-link" href="/ids/postal-id">Postal ID ↗</Link>{' · '}<Link className="text-link" href="/ids/philippine-passport">Passport ↗</Link></article>
        <article><h3>Current school ID</h3><p>Check PSA’s supporting-document options, or use your school ID with a Certificate of Registration for the adult student passport route.</p><Link className="text-link" href="/ids/national-id">National ID ↗</Link>{' · '}<Link className="text-link" href="/ids/philippine-passport">Passport ↗</Link></article>
        <article><h3>Passport or driver’s license</h3><p>Either can satisfy the Postal ID identity requirement. Bring separate proof of address.</p><Link className="text-link" href="/ids/postal-id">Postal ID ↗</Link></article>
      </div>
    </section>
    <section className="purpose section" id="purpose"><div className="wrap">
      <h2>What do you need it for?</h2><div className="purpose-list">
        <Link href="/ids/nbi-clearance">First job ↗</Link>
        <Link href="/ids/national-id">Bank account ↗</Link>
        <Link href="/ids/philippine-passport">Passport ↗</Link>
        <Link href="/ids/drivers-license">Driving ↗</Link>
        <Link href="/ids/voter-registration">Voter registration ↗</Link>
      </div>
    </div></section>
    <section className="wrap section" id="directory"><h2>Philippine ID directory</h2>
      <p>Check eligibility, what to bring, and where to apply.</p><Directory entries={entries} effortBySlug={effortBySlug} />
    </section>
    <section className="help-strip"><div className="wrap help-inner">
      <div><h2>Still stuck on a requirement?</h2><p>Send us your checklist and a consultant can help you figure out what to do next.</p></div>
      <div className="help-actions">
        <Link className="button" href="/consultation">Request a consultation <span aria-hidden="true">→</span></Link>
        <Link className="help-track" href="/track">Track an existing request <span aria-hidden="true">↗</span></Link>
      </div>
    </div></section>
  </>
}
