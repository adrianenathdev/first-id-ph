import type { DocumentKey } from './client-intake'

export const idFinderGoals = {
  first: 'Get my first valid ID',
  banking: 'Open a bank account',
  job: 'Prepare for my first job',
  passport: 'Apply for a passport',
  driving: 'Get a driver’s license',
  local: 'Find an ID from my city or barangay',
} as const

export type FinderGoal = keyof typeof idFinderGoals

export type FinderResult = {
  slug: string
  state: 'ready' | 'missing' | 'check'
  nextStep: string
  missing: string[]
  label?: string
}

export function findIdRoutes(goal: FinderGoal, documents: readonly DocumentKey[], city = '', psaBirthCertificate = false): FinderResult[] {
  const has = (...keys: DocumentKey[]) => keys.some(key => documents.includes(key))
  const proofOfAddress = has('barangay-residency', 'address-proof')
  const postalIdentity = has('birth-certificate', 'national-id', 'passport', 'drivers-license')
  const postalMissing = [
    !postalIdentity && 'A birth certificate accepted by PHLPost or another accepted proof of identity',
    !proofOfAddress && 'Separate proof of address, such as a Barangay Certificate of Residency',
  ].filter((item): item is string => Boolean(item))
  const postal: FinderResult = {
    slug: 'postal-id', state: postalMissing.length ? 'missing' : 'ready', missing: postalMissing,
    nextStep: 'Bring your identity and address documents to a PHLPost capturing site. Check its rules for originals, copies, and receipt dates.',
  }

  const national: FinderResult = has('national-id', 'philsys-slip') ? {
    slug: 'national-id', label: has('national-id') ? 'Use or retrieve your National ID' : 'Check for your Digital National ID',
    state: 'ready', missing: [],
    nextStep: 'If you’re registered, try retrieving the Digital National ID online. If your record isn’t available yet, check with your registration center.',
  } : {
    slug: 'national-id', state: 'check', missing: has('birth-certificate', 'school-id', 'postal-id', 'passport', 'drivers-license') ? [] : ['An identity document or a supporting-document combination accepted by PSA'],
    nextStep: 'Ask a PSA registration center which supporting documents it accepts for your situation, then register in person.',
  }

  const adultStudent = has('school-id') && has('certificate-of-registration')
  const standardPassportId = has('national-id', 'drivers-license')
  const passportMissing = [
    !has('birth-certificate') && 'A PSA-issued birth certificate for a first-time passport application',
    !standardPassportId && !adultStudent && !has('postal-id') &&
      (has('school-id') ? 'Your current Certificate of Registration to pair with your school ID if you’re enrolled'
        : has('certificate-of-registration') ? 'Your current school ID to pair with the Certificate of Registration, or a DFA-accepted ID'
        : 'One DFA-accepted ID, or a current school ID plus Certificate of Registration if you’re enrolled'),
  ].filter((item): item is string => Boolean(item))
  const passport: FinderResult = has('passport') ? {
    slug: 'philippine-passport', label: 'Check the passport renewal route', state: 'check', missing: [],
    nextStep: 'If you already have a Philippine passport and need a replacement or renewal, check DFA’s instructions for your case.',
  } : {
    slug: 'philippine-passport', state: passportMissing.length ? 'missing' : !psaBirthCertificate || (has('postal-id') && !standardPassportId && !adultStudent) ? 'check' : 'ready',
    missing: passportMissing,
    nextStep: 'Check DFA’s accepted IDs and book an appointment. The birth certificate must be PSA-issued. If using a Postal ID, confirm its issuance date and format with your DFA office.',
  }

  const permit: FinderResult = {
    slug: 'student-permit', state: 'check', missing: [],
    nextStep: 'Start with an LTO-accredited theoretical driving course. Check LTO’s accepted proof of identity and medical certificate requirements.',
  }
  const license: FinderResult = {
    slug: 'drivers-license', state: has('student-permit') ? 'check' : 'missing',
    missing: has('student-permit') ? [] : ['An LTO student permit held for at least one month'],
    nextStep: 'Confirm the permit holding period, complete the practical driving course, get an accredited medical certificate, and prepare for LTO’s exams.',
  }
  const nbi: FinderResult = {
    slug: 'nbi-clearance', state: 'check', missing: [],
    nextStep: 'Confirm the two documents NBI accepts for your appointment. If you qualify for the first-time jobseeker waiver, check the barangay certification and oath requirements.',
  }
  const local: FinderResult = {
    slug: 'local-id', state: 'check', missing: [],
    nextStep: `Ask ${city ? `your city or municipal hall in ${city}` : 'your city or municipal hall'} what local ID is available and what it accepts as proof of identity and residence.`,
  }

  const routes: Record<FinderGoal, FinderResult[]> = {
    first: [postal, national, passport],
    banking: [national, postal, passport],
    job: [national, nbi, postal],
    passport: [passport, national, postal],
    driving: has('student-permit') ? [license, national] : [permit, license, national],
    local: [local, postal, national],
  }
  const priority = { ready: 0, check: 1, missing: 2 }
  return routes[goal].sort((a, b) => priority[a.state] - priority[b.state])
}

export const finderHandoffKey = 'first-id-ph:consultation-draft'
