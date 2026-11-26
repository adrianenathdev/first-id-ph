import { authorizeStaff } from '../../../lib/server/staff'
import { ticketStages } from '../../../lib/ticket-status'

const pageSize = 20
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i

export async function GET(request: Request) {
  const auth = await authorizeStaff(request, false)
  if (!auth.admin) return auth.response!
  const params = new URL(request.url).searchParams
  const stage = params.get('stage')
  const page = Number(params.get('page') || '1')
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || (stage && !Object.hasOwn(ticketStages, stage))) {
    return Response.json({ error: 'Invalid ticket filter.' }, { status: 400 })
  }

  const offset = (page - 1) * pageSize
  let query = auth.admin.from('consultation_requests')
    .select('id,guide_slug,status,created_at,preferred_day,assigned_consultant_id,claimed_at,contacted_at,meeting_at,closed_at,question,contact_email,contact_channel,contact_profile,client_intake_snapshot,id_guides(name)')
    .order('created_at', { ascending: false }).order('id').range(offset, offset + pageSize)
  if (stage) query = query.eq('status', stage)
  if (auth.role === 'consultant') query = query.or(`status.eq.requested,assigned_consultant_id.eq.${auth.userId}`)
  const { data, error } = await query
  if (error) return Response.json({ error: 'Could not load consultation tickets.' }, { status: 502 })

  const visible = data.slice(0, pageSize)
  const assignees = auth.role === 'admin' ? [...new Set(visible.flatMap(ticket => ticket.assigned_consultant_id ? [ticket.assigned_consultant_id] : []))] : []
  const names = new Map(await Promise.all(assignees.map(async id => {
    const { data: result } = await auth.admin!.auth.admin.getUserById(id)
    const nickname = result?.user?.app_metadata.staff_nickname
    return [id, typeof nickname === 'string' ? nickname : result?.user?.email ?? 'Assigned consultant'] as const
  })))
  const tickets = visible.map(({ contact_email, contact_channel, contact_profile, question, assigned_consultant_id, id_guides, client_intake_snapshot, ...ticket }) => {
    const assignedToMe = assigned_consultant_id === auth.userId
    const canReadDetails = auth.role === 'admin' || assignedToMe
    const guide = Array.isArray(id_guides) ? id_guides[0] : id_guides
    return {
      ...ticket, assignedToMe,
      guideName: guide?.name ?? null,
      consultant: assigned_consultant_id ? names.get(assigned_consultant_id) ?? (assignedToMe ? 'You' : 'Assigned consultant') : null,
      question: canReadDetails ? question : null,
      contactEmail: canReadDetails ? contact_email : null,
      contactChannel: canReadDetails ? contact_channel : null,
      contactProfile: canReadDetails ? contact_profile : null,
      clientIntake: canReadDetails ? client_intake_snapshot : null,
    }
  })
  return Response.json({ tickets, hasMore: data.length > pageSize }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const auth = await authorizeStaff(request, false)
  if (!auth.userClient) return auth.response!
  if (auth.role !== 'consultant') return Response.json({ error: 'Only consultants can update tickets.' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (typeof body?.id !== 'string' || !uuid.test(body.id) || !['claim', 'contact', 'schedule', 'close'].includes(body.action)) {
    return Response.json({ error: 'Invalid ticket action.' }, { status: 400 })
  }
  let meeting: string | null = null
  if (body.action === 'schedule') {
    if (typeof body.meeting !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(body.meeting)) {
      return Response.json({ error: 'Enter a meeting date and time.' }, { status: 400 })
    }
    const time = new Date(body.meeting + ':00+08:00')
    if (Number.isNaN(time.getTime()) || time.getTime() <= Date.now()) {
      return Response.json({ error: 'Choose a future meeting time.' }, { status: 400 })
    }
    meeting = time.toISOString()
  }
  const { data, error } = await auth.userClient.rpc('advance_consultation', {
    ticket_id: body.id, action: body.action, meeting_time: meeting,
  })
  if (error) return Response.json({ error: 'Could not update the ticket.' }, { status: 502 })
  if (!data) return Response.json({ error: 'This ticket changed or is assigned to someone else. Refresh the queue.' }, { status: 409 })
  return Response.json({ ok: true })
}
