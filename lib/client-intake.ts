export const documentOptions = {
  'birth-certificate': 'PSA or local civil registry birth certificate',
  'school-id': 'Current school ID',
  'certificate-of-registration': 'School Certificate of Registration',
  'national-id': 'National ID, paper National ID, or Digital National ID',
  'philsys-slip': 'PhilSys transaction slip',
  'postal-id': 'Postal ID',
  'passport': 'Philippine passport',
  'student-permit': 'LTO student permit',
  'drivers-license': 'Driver’s license',
  'barangay-residency': 'Barangay Certificate of Residency',
  'address-proof': 'Other proof of address, such as a utility bill or lease',
  'other': 'Other ID or supporting document',
} as const

export type DocumentKey = keyof typeof documentOptions
export type ClientIntake = {
  full_name: string
  age: number
  barangay: string
  city: string
  province: string
  documents: DocumentKey[]
}
