import type { Metadata } from 'next'
import { getConsultationMode, getConsultationPrivacyDetails } from '../../lib/consultation-privacy'

export const metadata: Metadata = { title: 'Consultation privacy notice' }
export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  const details = getConsultationPrivacyDetails()
  const mode = getConsultationMode()

  if (mode.demo) return <article className="wrap section guide consultation">
    <h1>Demo consultation privacy notice</h1>
    <p className="intro">Use fictional details in this demo. The form saves a sample name, age, address, email and question regardless of what you type.</p>
    <h2>What the demo saves</h2>
    <p>It saves your selected ID guide and document types, the sample record, the date and version of your agreement, and the ticket’s progress in Supabase. If you choose a social platform, it saves a sample profile link. It also stores a protected version of the tracking code so you can check the ticket’s progress.</p>
    <h2>Who can see the sample request</h2>
    <p>Admins and the consultant who claims it can see the sample details. Anyone with the tracking code can see the ticket status and any scheduled meeting time. The demo is for testing and does not send consultation messages.</p>
    <p>Version {mode.privacyVersion}</p>
  </article>

  return <article className="wrap section guide consultation">
    <h1>Consultation privacy notice</h1>
    <p className="intro">How First ID PH handles your information when you request help obtaining an ID.</p>
    {!details && <p className="privacy-notice">The controller’s contact details and retention policy are being finalized. Use sample information only in this preview.</p>}

    <h2>What you share</h2>
    <p>We collect your name, email, age, barangay, city or municipality, province, document checklist, the ID you need help with, and what you write about your request. If you provide a Facebook or Instagram link, we collect that link. We generate a tracking code and record the status of your request, any scheduled meeting, and the notice version and time of your consent.</p>
    <p>Share only what we need to guide you. Keep ID numbers, scans, passwords, and unrelated personal information out of the form.</p>

    <h2>Why we ask for this information</h2>
    <p>With your consent, we use your age, location, and checklist to understand which ID application routes may fit your situation. We use your contact details to follow up about the consultation. You can browse the public ID guides without submitting a consultation request.</p>

    <h2>Who can see it</h2>
    <p>Authorized First ID PH admins and the consultant assigned to your request can see your details. Our database provider, Supabase, hosts the project in Sydney, Australia. If you share a social profile and the consultant messages you there, that message also passes through the chosen platform.</p>
    <p>Anyone with your tracking code can see the request status and scheduled meeting time. Keep the code private. Staff review consultation requests and provide guidance. The document checklist does not automatically determine whether an agency will issue you an ID.</p>

    <h2>How long we keep it</h2>
    <p>{details?.retention ?? 'A retention period has not been set for this preview.'}</p>

    <h2>Your privacy rights</h2>
    <p>Under the Philippine Data Privacy Act of 2012, you can ask to access or correct your information, withdraw consent, request blocking or deletion where applicable, or raise a privacy complaint. You may also contact the National Privacy Commission.</p>
    {details && <p>For privacy requests, contact {details.controller} at <a className="text-link" href={`mailto:${details.contact}`}>{details.contact}</a>.</p>}
    <p>Version {mode.privacyVersion} · <a className="text-link" href="https://privacy.gov.ph/the-right-to-be-informed/">National Privacy Commission guidance ↗</a></p>
  </article>
}
