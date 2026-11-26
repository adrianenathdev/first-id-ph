import { createHmac, randomInt } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function makeTrackingCode() {
  return Array.from({ length: 8 }, () => letters[randomInt(letters.length)]).join('')
}

export function getGuestServices() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY
  const trackingKey = process.env.TRACKING_CODE_SECRET
  if (!url || !serviceKey || !trackingKey || trackingKey.length < 32) return null

  return {
    db: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }),
    hash: (purpose: string, value: string) => createHmac('sha256', trackingKey).update(purpose + ':' + value).digest('hex'),
  }
}

export function browserFingerprint(request: Request) {
  return (request.headers.get('x-vercel-forwarded-for') ??
    request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim().toLowerCase()
}

export function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}
