export const consultationPrivacyVersion = '2026-11-26-v1'

export function getConsultationPrivacyDetails() {
  const controller = process.env.CONSULTATION_PRIVACY_CONTROLLER?.trim()
  const contact = process.env.CONSULTATION_PRIVACY_EMAIL?.trim()
  const retention = process.env.CONSULTATION_PRIVACY_RETENTION?.trim()
  if (!controller || !contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || !retention) return null
  return { controller, contact, retention }
}

export function getConsultationMode() {
  const details = getConsultationPrivacyDetails()
  const demo = process.env.CONSULTATION_DEMO_MODE === 'true' || (!details && process.env.NODE_ENV !== 'production')
  return {
    demo,
    available: demo || Boolean(details),
    privacyVersion: demo ? '2026-11-26-demo-v1' : consultationPrivacyVersion,
  }
}
