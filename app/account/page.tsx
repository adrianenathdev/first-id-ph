import type { Metadata } from 'next'
import Account from './account'

export const metadata: Metadata = { title: 'Your account' }

export default function AccountPage() {
  return <section className="wrap section guide consultation">
    <h1>Your account</h1>
    <Account />
  </section>
}
