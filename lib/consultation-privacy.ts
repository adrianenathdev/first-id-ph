export const consultationPrivacyVersion = '2026-11-26-v1'

export function getConsultationPrivacyDetails() {
  const controller = process.env.CONSULTATION_PRIVACY_CONTROLLER?.trim()
  const contact = process.env.CONSULTATION_PRIVACY_EMAIL?.trim()
  const retention = process.env.CONSULTATION_PRIVACY_RETENTION?.trim()
  if (!controller || !contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) || !retention) return null
  return { controller, contact, retention }
}
