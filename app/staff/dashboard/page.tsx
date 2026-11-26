import type { Metadata } from 'next'
import Account from '../../account/account'

export const metadata: Metadata = { title: 'Staff dashboard', robots: { index: false } }

export default function StaffDashboardPage() {
  return <section className="wrap section consultation staff-area">
    <Account staff dashboard />
  </section>
}
