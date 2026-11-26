import type { Metadata } from 'next'
import StaffPassword from './staff-password'

export const metadata: Metadata = { title: 'Set staff password' }

export default function StaffSetupPage() {
  return <section className="wrap section guide consultation">
    <h1>Set your staff password</h1>
    <StaffPassword />
  </section>
}
