import { createClient } from '@supabase/supabase-js'

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

export async function authorizeStaff(request: Request, adminOnly = true) {
  const token = /^Bearer (\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!token) return { response: Response.json({ error: 'Sign in first.' }, { status: 401 }) }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !publishable || !secret) {
    return { response: Response.json({ error: 'Staff management is not configured.' }, { status: 503 }) }
  }

  const userClient = createClient(url, publishable, {
    ...options, global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await userClient.auth.getUser(token)
  if (error || !user?.email_confirmed_at) return { response: Response.json({ error: 'Verify your email and sign in again.' }, { status: 401 }) }
  const { data: claims } = await userClient.auth.getClaims(token)
  if (!claims?.claims.amr?.some(item => item.method === 'password')) {
    return { response: Response.json({ error: 'Sign in with your staff password.' }, { status: 403 }) }
  }
  const { data: profile } = await userClient.from('profiles').select('role,enabled').eq('user_id', user.id).single()
  if (!profile?.enabled || (profile.role !== 'admin' && (adminOnly || profile.role !== 'consultant'))) {
    return { response: Response.json({ error: adminOnly ? 'Admin access is required.' : 'Staff access is required.' }, { status: 403 }) }
  }
  return { admin: createClient(url, secret, options), userClient, userId: user.id, role: profile.role }
}
