import { getConsultationMode } from '../../../lib/consultation-privacy'
import { demoConsultation, demoSocialProfiles } from '../../../lib/consultation-demo'
import { readProfile, validContactEmail } from '../../../lib/contact-format'
import { documentOptions } from '../../../lib/client-intake'
import { browserFingerprint, getGuestServices, makeTrackingCode, reply } from '../../../lib/server/guest-consultations'

function readText(value: unknown, max: number) {
  if (typeof value !== 'string') return ''
  const text = value.trim()
  return text.length <= max ? text : ''
}

export async function POST(request: Request) {
  const services = getGuestServices()
  const mode = getConsultationMode()
  if (!services || !mode.available) return reply({ error: 'Consultation submissions are temporarily unavailable.' }, 503)
  const raw = await request.text()
  if (raw.length > 12000) return reply({ error: 'This request is too long.' }, 413)
  const body = (() => { try { return JSON.parse(raw) } catch { return null } })()
  if (body?.privacyConsent !== true) return reply({ error: 'Review the privacy notice and agree before submitting.' }, 400)
  if (body.privacyVersion !== mode.privacyVersion) return reply({ error: 'The privacy notice changed. Reload the form and review it again.' }, 409)
  const submittedDetails = mode.demo ? demoConsultation : body
  const full_name = readText(submittedDetails?.full_name, 120)
  const age = submittedDetails?.age
  const barangay = readText(submittedDetails?.barangay, 100)
  const city = readText(submittedDetails?.city, 100)
  const province = readText(submittedDetails?.province, 100)
  const question = readText(submittedDetails?.question, 800)
  const guide = readText(body?.guide, 120) || null
  const documents = body?.documents
  const channel = body?.channel
  const email = readText(submittedDetails?.email, 254)

  if (!full_name || !Number.isInteger(age) || age < 18 || age > 120 || !barangay || !city || !province || !question ||
      !Array.isArray(documents) || documents.length > Object.keys(documentOptions).length ||
      documents.some(value => typeof value !== 'string' || !Object.hasOwn(documentOptions, value))) {
    return reply({ error: 'Check your name, age, address, document checklist, and question.' }, 400)
  }
  if (!validContactEmail(email)) {
    return reply({ error: 'Enter a valid email address.' }, 400)
  }
  if (channel !== 'email' && channel !== 'facebook' && channel !== 'instagram') {
    return reply({ error: 'Choose no social profile, Facebook, or Instagram.' }, 400)
  }
  const profile = channel === 'email' ? null : mode.demo ? demoSocialProfiles[channel] : readProfile(readText(body?.socialProfile, 254), channel)
  if (channel !== 'email' && !profile) {
    return reply({ error: 'Provide a valid profile link for the selected platform.' }, 400)
  }

  const { db, hash } = services
  const fingerprint = await hash('network', browserFingerprint(request))
  if (!fingerprint) return reply({ error: 'Consultation submissions are temporarily unavailable.' }, 503)
  const rate = await db.rpc('allow_consultation_request', { action: 'submit', fingerprint })
  if (rate.error) return reply({ error: 'Consultation submissions are temporarily unavailable.' }, 503)
  if (!rate.data) return reply({ error: 'Too many requests. Try again in 15 minutes.' }, 429)

  if (guide) {
    const { data, error } = await db.from('id_guides').select('slug').eq('slug', guide).eq('published', true).maybeSingle()
    if (error) return reply({ error: 'The ID directory is temporarily unavailable.' }, 503)
    if (!data) return reply({ error: 'Choose a guide from the list.' }, 400)
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = makeTrackingCode()
    const trackingHash = await hash('tracking', code)
    if (!trackingHash) return reply({ error: 'Consultation submissions are temporarily unavailable.' }, 503)
    const { error } = await db.from('consultation_requests').insert({
      user_id: null, contact_email: email, contact_channel: channel, contact_profile: profile,
      guide_slug: guide, question, tracking_code_hash: trackingHash,
      privacy_notice_version: mode.privacyVersion, privacy_consented_at: new Date().toISOString(),
      client_intake_snapshot: { full_name, age, barangay, city, province, documents: [...new Set(documents)] },
    })
    if (!error) return reply({ code }, 201)
    if (error.code !== '23505') break
  }
  return reply({ error: 'Your request could not be saved. Please try again.' }, 502)
}
