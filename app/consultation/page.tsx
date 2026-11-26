import type { Metadata } from 'next'
import Link from 'next/link'
import { getEntries } from '../../lib/ids'
import GuestForm from './guest-form'
import { consultationPrivacyVersion, getConsultationPrivacyDetails } from '../../lib/consultation-privacy'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'One-on-one consultation' }

export default async function ConsultationPage() {
  const entries = await getEntries()
  const privacyReady = Boolean(getConsultationPrivacyDetails())
  return <section className="wrap section consultation consult-layout">
    <div className="consult-layout-intro">
      <h1>Get help with your ID</h1>
      <p className="intro">For adults 18 and older who need help choosing an ID or getting their documents ready.</p>
      <div className="consult-expectations">
        <h2>What happens next</h2>
        <ol>
          <li><strong>Send your checklist.</strong> Tell us what you have and what’s holding up your application.</li>
          <li><strong>Save your tracking code.</strong> You’ll see it after submitting.</li>
          <li><strong>Watch for a reply.</strong> Your consultant will contact you directly.</li>
        </ol>
      </div>
      <Link className="text-link" href="/track">Already have a code? Track your request ↗</Link>
    </div>
    <div className="consult-layout-form">
      {privacyReady || process.env.NODE_ENV !== 'production'
        ? <GuestForm privacyVersion={consultationPrivacyVersion} preview={!privacyReady} guides={entries.map(({ slug, name }) => ({ slug, name }))} />
        : <p className="privacy-notice" role="status">Consultation requests are unavailable while we finalize the privacy notice.</p>}
    </div>
  </section>
}
