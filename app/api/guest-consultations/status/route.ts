import { browserFingerprint, getGuestServices, reply } from '../../../../lib/server/guest-consultations'

export async function POST(request: Request) {
  const services = getGuestServices()
  if (!services) return reply({ error: 'Status lookup is temporarily unavailable.' }, 503)
  const body = await request.json().catch(() => null)
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!/^[A-Z]{8}$/.test(code)) return reply({ error: 'Enter your eight-letter tracking code.' }, 400)

  const { db, hash } = services
  const rate = await db.rpc('allow_consultation_request', { action: 'status', fingerprint: hash('network', browserFingerprint(request)) })
  if (rate.error) return reply({ error: 'Status lookup is temporarily unavailable.' }, 503)
  if (!rate.data) return reply({ error: 'Too many attempts. Try again in 15 minutes.' }, 429)

  const { data, error } = await db.from('consultation_requests').select('status,meeting_at')
    .eq('tracking_code_hash', hash('tracking', code)).maybeSingle()
  if (error) return reply({ error: 'Could not check your status.' }, 502)
  if (!data) return reply({ error: 'No request was found for this code. Check the letters and try again.' }, 404)
  return reply({ status: data.status, meetingAt: data.meeting_at })
}
