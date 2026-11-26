export const ticketStages = {
  requested: 'Unclaimed',
  claimed: 'Claimed',
  contacted: 'Reached out',
  scheduled: 'Meeting scheduled',
  completed: 'Closed',
  cancelled: 'Cancelled',
} as const

export type TicketStage = keyof typeof ticketStages

export function formatMeeting(value: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(value))
}
