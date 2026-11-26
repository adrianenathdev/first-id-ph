'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getBrowserClient } from '../lib/browser-auth'

export default function AccountLinks() {
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<{ userId: string; staff: boolean }>()
  const signedIn = Boolean(userId)
  const staff = Boolean(userId && role?.userId === userId && role.staff)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = getBrowserClient()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
      if (!session) setFailed(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const supabase = getBrowserClient()
    if (!supabase || !userId) return
    let active = true
    void supabase.from('profiles').select('role,enabled').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (active) setRole({ userId, staff: Boolean(data?.enabled && (data.role === 'admin' || data.role === 'consultant')) })
    })
    return () => { active = false }
  }, [userId])

  async function logout() {
    const supabase = getBrowserClient()
    if (!supabase || busy) return
    setBusy(true)
    setFailed(false)
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) throw error
      setMenuOpen(false)
      router.replace(pathname.startsWith('/staff/') ? '/staff/login' : '/account')
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const staffPage = pathname === '/staff/login' || pathname === '/staff/dashboard'
  const checkingRole = signedIn && role?.userId !== userId
  const closeMenu = () => setMenuOpen(false)
  return <nav className="main-menu" aria-label="Main" onKeyDown={event => {
    if (event.key === 'Escape' && menuOpen) {
      closeMenu()
      menuButton.current?.focus()
    }
  }}>
    <button ref={menuButton} type="button" className="button button-outline main-menu-toggle" aria-expanded={menuOpen}
      aria-controls="site-menu" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? 'Close menu' : 'Menu'}</button>
    <div className="main-menu-links" id="site-menu" data-open={menuOpen}>
      {!staff && !checkingRole && pathname !== '/staff/dashboard' && <>
        <Link href="/#start" onClick={closeMenu}>Start here</Link>
        <Link href="/#directory" onClick={closeMenu}>Browse IDs</Link>
        <Link href="/consultation" onClick={closeMenu} aria-current={pathname === '/consultation' ? 'page' : undefined}>Consultation</Link>
      </>}
      <Link href="/track" onClick={closeMenu} aria-current={pathname === '/track' ? 'page' : undefined}>Track request</Link>
      <Link className="main-menu-account" onClick={closeMenu} href={staff ? '/staff/dashboard' : signedIn ? '/account' : '/staff/login'}>
        {signedIn ? 'Dashboard' : 'Staff sign-in'}
      </Link>
      {signedIn && !staffPage && <div className="header-logout">
        <button className="button button-outline" type="button" disabled={busy} onClick={logout}>{busy ? 'Logging out…' : 'Log out'}</button>
        {failed && <p role="alert">Could not log out. Try again.</p>}
      </div>}
    </div>
  </nav>
}
