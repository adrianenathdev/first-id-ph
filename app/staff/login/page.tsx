import type { Metadata } from 'next'
import Account from '../../account/account'

export const metadata: Metadata = { title: 'Staff sign-in' }

export default function StaffLoginPage() {
  return <section className="wrap section consultation staff-area">
    <Account staff />
  </section>
}
