import { authorizeStaff } from '../../../lib/server/staff'

const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i

export async function GET(request: Request) {
  const auth = await authorizeStaff(request)
  if (!auth.admin) return auth.response!
  const params = new URL(request.url).searchParams
  const page = Number(params.get('page') || '1')
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return Response.json({ error: 'Invalid page.' }, { status: 400 })
  const { data, error } = await auth.admin.rpc('list_staff_consultants', {
    pending_only: params.get('pending') === 'true', page_offset: (page - 1) * 20,
  })
  if (error) return Response.json({ error: 'Could not load consultants.' }, { status: 502 })
  const staff = data.slice(0, 20).map(({ full_name, ...entry }: { full_name: string; user_id: string; enabled: boolean; email: string; confirmed: boolean; nickname: string }) => ({
    ...entry, fullName: full_name,
  }))
  return Response.json({ staff, hasMore: data.length > 20 }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const auth = await authorizeStaff(request)
  if (!auth.admin) return auth.response!
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!fullName || fullName.length > 120 || !nickname || nickname.length > 40) {
    return Response.json({ error: 'Enter a full name and a nickname.' }, { status: 400 })
  }
  if ([...password].length < 12 || !password.trim() || new TextEncoder().encode(password).length > 72) {
    return Response.json({ error: 'Use a password of at least 12 characters and at most 72 bytes.' }, { status: 400 })
  }
  const appUrl = process.env.APP_URL
  if (!appUrl) return Response.json({ error: 'The invite redirect URL is not configured.' }, { status: 503 })
  let redirect: URL | undefined
  try { redirect = new URL('/staff/login', appUrl) } catch { /* Return a configuration error below. */ }
  if (!redirect || !['https:', 'http:'].includes(redirect.protocol)) {
    return Response.json({ error: 'The invite redirect URL is invalid.' }, { status: 503 })
  }
  const { data, error } = await auth.admin.auth.admin.inviteUserByEmail(email, { redirectTo: redirect.href })
  if (error || !data?.user) {
    return Response.json({ error: 'Could not invite this address. Check for an existing account or a Supabase email issue.' }, { status: 409 })
  }
  const { error: accountError } = await auth.admin.auth.admin.updateUserById(data.user.id, {
    password,
    app_metadata: { staff_full_name: fullName, staff_nickname: nickname },
  })
  if (accountError) {
    return Response.json({ error: 'The invite email was sent, but setup did not finish. A Supabase admin must complete this account before it can use staff features.' }, { status: 502 })
  }
  const { data: updated, error: updateError } = await auth.admin.from('profiles').update({ role: 'consultant' })
    .eq('user_id', data.user.id).eq('role', 'client').select('user_id').single()
  if (updateError || !updated) {
    return Response.json({ error: 'The invitation was sent, but the consultant role could not be assigned. Check the profile in Supabase Studio.' }, { status: 502 })
  }
  return Response.json({ ok: true }, { status: 201 })
}

export async function PATCH(request: Request) {
  const auth = await authorizeStaff(request)
  if (!auth.admin) return auth.response!
  const body = await request.json().catch(() => null)
  if (typeof body?.userId !== 'string' || !uuid.test(body.userId) || typeof body?.enabled !== 'boolean') {
    return Response.json({ error: 'Invalid account update.' }, { status: 400 })
  }
  const { data, error } = await auth.admin.from('profiles').update({ enabled: body.enabled })
    .eq('user_id', body.userId).eq('role', 'consultant').select('user_id').maybeSingle()
  if (error) return Response.json({ error: 'Could not update this account.' }, { status: 502 })
  if (!data) return Response.json({ error: 'Consultant account not found.' }, { status: 404 })
  return Response.json({ ok: true })
}
