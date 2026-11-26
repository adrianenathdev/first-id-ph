import type { Metadata } from 'next'
import Link from 'next/link'
import AccountLinks from './account-links'
import ExternalLinkDialog from './external-link-dialog'
import './style.css'

export const metadata: Metadata = {
  title: { default: 'First ID PH — Your first valid ID', template: '%s | First ID PH' },
  description: 'A guide for adults 18 and older who need a valid Philippine ID. See what to bring and where to apply.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-PH"><body>
    <a className="skip" href="#main">Skip to content</a>
    <header className="site-header"><div className="wrap nav">
      <Link className="logo" href="/">FIRST ID<span> PH</span></Link>
      <AccountLinks />
    </div></header>
    <main id="main">{children}</main>
    <footer><div className="wrap nav"><Link className="logo" href="/">FIRST ID<span> PH</span></Link><p>Independent guide to Philippine IDs.</p></div></footer>
    <ExternalLinkDialog />
  </body></html>
}
