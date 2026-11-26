'use client'

import { useState } from 'react'
import { ticketStages, type TicketStage } from '../../lib/ticket-status'
import StaffManager from './staff-manager'
import TicketDashboard from './ticket-dashboard'

type StaffView = 'consultants' | 'pending' | 'all' | TicketStage

const stageColors: Record<TicketStage, string> = {
  requested: 'yellow', claimed: 'teal', contacted: 'blue',
  scheduled: 'purple', completed: 'green', cancelled: 'gray',
}

export default function StaffDashboard({ token, admin, email, name, signingOut, message, onSignOut }: {
  token: string
  admin: boolean
  email: string
  name: string | null
  signingOut: boolean
  message: string
  onSignOut: () => void
}) {
  const [view, setView] = useState<StaffView>(admin ? 'consultants' : 'requested')
  const consultantView = view === 'consultants' || view === 'pending'
  const role = admin ? 'Administrator' : 'Consultant'
  const identity = name || email
  const initials = identity.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('')
  const viewName = view === 'consultants' ? 'Manage consultants' : view === 'pending' ? 'Pending invitations' : view === 'all' ? 'All tickets' : ticketStages[view]

  function menuItem(value: StaffView, label: string, indicator: string) {
    return <button type="button" key={value} className="staff-menu-item" aria-pressed={view === value} onClick={() => setView(value)}>
      <span className={`staff-menu-dot staff-menu-dot-${indicator}`} aria-hidden="true" />
      {label}
    </button>
  }

  return <div className="staff-workspace">
    <header className="workspace-heading">
      <div><h1>{admin ? 'Admin dashboard' : 'Consultant dashboard'}</h1><p>{admin ? 'Manage consultants and follow client consultations.' : 'Claim tickets and track your client consultations.'}</p></div>
      <div className="workspace-user">
        <span className="workspace-avatar" aria-hidden="true">{initials || 'PH'}</span>
        <div><strong>{role}</strong><span>{identity}</span></div>
        <button className="button button-outline" type="button" disabled={signingOut} onClick={onSignOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
      </div>
    </header>
    {message && <p role="alert">{message}</p>}
    <div className="staff-dashboard">
      <aside className="staff-sidebar">
        <nav aria-label="Staff dashboard">
          {admin && <div className="staff-menu-group">
            <h2>Consultants</h2>
            {menuItem('consultants', 'Manage consultants', 'teal')}
            {menuItem('pending', 'Pending invitations', 'yellow')}
          </div>}
          <div className="staff-menu-group">
            <h2>Consultations</h2>
            {menuItem('all', 'All tickets', 'gray')}
            {(Object.keys(ticketStages) as TicketStage[]).map(stage => menuItem(stage, ticketStages[stage], stageColors[stage]))}
          </div>
        </nav>
      </aside>
      <div className="staff-dashboard-content" aria-label={viewName}>
        {admin && consultantView
          ? <StaffManager key={view} token={token} pendingOnly={view === 'pending'} />
          : <TicketDashboard key={view} token={token} admin={admin} stage={view === 'all' || consultantView ? '' : view} />}
      </div>
    </div>
  </div>
}
