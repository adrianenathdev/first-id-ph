insert into public.id_guides (slug, name, agency, category, summary, bring, apply, source, position, published)
select slug, name, agency, category, summary, bring, apply, source, position, true
from jsonb_populate_recordset(null::public.id_guides, $catalog$
[
  {
    "slug": "national-id",
    "name": "National ID / PhilSys",
    "agency": "PSA",
    "category": "First IDs",
    "summary": "Register in person or retrieve the digital ID if already registered. BSP directs its supervised financial institutions to accept official National ID formats as primary proof of identity.",
    "bring": [
      "Check the PSA list for accepted supporting documents",
      "Bring a current eligible school ID or other accepted proof as applicable"
    ],
    "apply": "https://philsys.gov.ph/registration-center/",
    "source": "https://philsys.gov.ph/supporting-documents/",
    "position": 0
  },
  {
    "slug": "postal-id",
    "name": "Postal ID",
    "agency": "PHLPost",
    "category": "First IDs",
    "summary": "Apply in person at a Postal ID capturing site. You can use a PSA birth certificate as proof of identity.",
    "bring": [
      "Completed Postal ID application form",
      "PSA birth certificate or other accepted identity document",
      "Separate proof of address such as a barangay certificate of residency"
    ],
    "apply": "https://phlpost.gov.ph/news_and_updates/postal-id-application-form/",
    "source": "https://phlpost.gov.ph/cpt-press-releases/phlpost-simplifies-postal-id-application-for-all/",
    "position": 1
  },
  {
    "slug": "philippine-passport",
    "name": "Philippine passport",
    "agency": "DFA",
    "category": "First IDs",
    "summary": "For Filipino citizens. Adult first-time applicants book an appointment and appear in person. Current adult students can check DFA’s school-ID route.",
    "bring": [
      "Appointment and application form",
      "PSA birth certificate",
      "Accepted identification, such as National ID or a current school ID with Certificate of Registration",
      "Copies and any extra documents required by your DFA office"
    ],
    "apply": "https://www.passport.gov.ph/",
    "source": "https://aganapcg.dfa.gov.ph/images/2024/2024Forms/ANNEX_F__LIST_OF_ACCEPTABLE_IDs_FOR_PHILIPPINE_PASSPORT_APPLICATION.pdf",
    "position": 2
  },
  {
    "slug": "drivers-license",
    "name": "Non-professional driver’s license",
    "agency": "LTO",
    "category": "First IDs",
    "summary": "Filipino applicants can qualify from age 17. Training, a medical certificate, and driving exams apply.",
    "bring": [
      "Student permit held for at least one month",
      "Practical driving course completion",
      "Medical certificate from an LTO-accredited clinic",
      "Other documents listed by LTO"
    ],
    "apply": "https://portal.lto.gov.ph/",
    "source": "https://www.lto.gov.ph/wp-content/uploads/2024/05/LTO_CC_05-30-2024.pdf",
    "position": 3
  },
  {
    "slug": "student-permit",
    "name": "Student driver’s permit",
    "agency": "LTO",
    "category": "Driving",
    "summary": "The first step toward a driver’s license. Check format conditions if using the permit as identification.",
    "bring": [
      "Theoretical driving course completion",
      "LTO-accredited medical certificate",
      "Accepted identity documents"
    ],
    "apply": "https://portal.lto.gov.ph/",
    "source": "https://www.ltoncr.com/student-permit-application/",
    "position": 4
  },
  {
    "slug": "local-id",
    "name": "City, municipal, or barangay ID",
    "agency": "Local government",
    "category": "Local IDs",
    "summary": "Eligibility and availability vary by locality. The linked example is for Quezon City residents.",
    "bring": [
      "Check your local Citizen’s Charter",
      "Bring the proof of residence and identity listed by your LGU"
    ],
    "apply": "https://quezoncity.gov.ph/qcitizen-guides/how-to-apply-for-a-qcitizen-id/",
    "source": "https://quezoncity.gov.ph/faqs/faqs-qcitizen-id/",
    "position": 5
  },
  {
    "slug": "school-id",
    "name": "School ID",
    "agency": "School registrar",
    "category": "Local IDs",
    "summary": "For currently enrolled students. Acceptance varies by transaction.",
    "bring": [
      "Ask your registrar for school-specific requirements",
      "For a first adult passport, check the DFA requirement for a Certificate of Registration"
    ],
    "apply": "https://aganapcg.dfa.gov.ph/images/2024/2024Forms/ANNEX_F__LIST_OF_ACCEPTABLE_IDs_FOR_PHILIPPINE_PASSPORT_APPLICATION.pdf",
    "source": "https://aganapcg.dfa.gov.ph/images/2024/2024Forms/ANNEX_F__LIST_OF_ACCEPTABLE_IDs_FOR_PHILIPPINE_PASSPORT_APPLICATION.pdf",
    "position": 6
  },
  {
    "slug": "tin-id",
    "name": "Digital TIN ID",
    "agency": "BIR",
    "category": "Membership IDs",
    "summary": "For individual taxpayers with an existing TIN. The digital ID provides proof of TIN ownership.",
    "bring": [
      "Existing TIN",
      "ORUS account and required photo for the ORUS route"
    ],
    "apply": "https://orus.bir.gov.ph/",
    "source": "https://bir-cdn.bir.gov.ph/local/pdf/RMC%20No.%20120-2023.pdf",
    "position": 7
  },
  {
    "slug": "philhealth-id",
    "name": "PhilHealth ID",
    "agency": "PhilHealth",
    "category": "Membership IDs",
    "summary": "Register or request membership assistance through a local PhilHealth office.",
    "bring": [
      "PhilHealth Member Registration Form",
      "Supporting documents for your membership category"
    ],
    "apply": "https://www.philhealth.gov.ph/downloads/",
    "source": "https://www.philhealth.gov.ph/members/informal/registration.php",
    "position": 8
  },
  {
    "slug": "mysss-card",
    "name": "MySSS Card",
    "agency": "SSS",
    "category": "Membership IDs",
    "summary": "For eligible SSS registrants. It replaces new SSS UMID issuance. SSS says previously issued cards remain valid.",
    "bring": [
      "Permanent SS number and My.SSS account",
      "National ID registration and matching records",
      "Partner bank account-opening requirements"
    ],
    "apply": "https://www.sss.gov.ph/mysss-card/",
    "source": "https://www.sss.gov.ph/mysss-card/",
    "position": 9
  },
  {
    "slug": "pagibig-card",
    "name": "Pag-IBIG Loyalty Card Plus",
    "agency": "Pag-IBIG Fund",
    "category": "Membership IDs",
    "summary": "For eligible Pag-IBIG members. An accepted ID is required for the application.",
    "bring": [
      "Membership details",
      "Valid ID",
      "Application form and applicable fee"
    ],
    "apply": "https://www.pagibigfund.gov.ph/",
    "source": "https://www.pagibigfund.gov.ph/document/pdf/circulars/provident/Circular%20No.%20450%20-%20Modified%20Guidelines%20on%20the%20Availment%20of%20the%20Pag-IBIG%20Fund%20Loyalty%20Card%20Plus.pdf",
    "position": 10
  },
  {
    "slug": "gsis-id",
    "name": "GSIS Digital ID",
    "agency": "GSIS",
    "category": "Membership IDs",
    "summary": "For eligible GSIS members and pensioners.",
    "bring": [
      "Follow the current GSIS enrollment and identity verification instructions"
    ],
    "apply": "https://www.gsis.gov.ph/",
    "source": "https://omcrs.nia.gov.ph/?q=system%2Ffiles%2Fmc%2F2024_066.pdf",
    "position": 11
  },
  {
    "slug": "pwd-id",
    "name": "PWD ID",
    "agency": "Local PDAO or social welfare office",
    "category": "Eligibility-based IDs",
    "summary": "For eligible persons with disabilities. Apply through your city or municipality.",
    "bring": [
      "Proof of identity and residence as required",
      "Disability documentation where required",
      "Photos or other documents listed by the local issuing office"
    ],
    "apply": "https://ncda.gov.ph/disability-laws/administrative-orders/ncda-administrative-order-no-001-series-of-2021/",
    "source": "https://ncda.gov.ph/disability-laws/administrative-orders/ncda-administrative-order-no-001-series-of-2021/",
    "position": 12
  },
  {
    "slug": "solo-parent-id",
    "name": "Solo Parent ID",
    "agency": "Local social welfare office",
    "category": "Eligibility-based IDs",
    "summary": "For qualified solo parents. Your local social welfare office handles the application.",
    "bring": [
      "Proof of identity and residence",
      "Documents supporting your solo-parent eligibility category"
    ],
    "apply": "https://quezoncity.gov.ph/departments/social-services-development-department/",
    "source": "https://quezoncity.gov.ph/departments/social-services-development-department/",
    "position": 13
  },
  {
    "slug": "prc-id",
    "name": "Professional Identification Card",
    "agency": "PRC",
    "category": "Work IDs",
    "summary": "For applicants who meet licensing requirements and complete initial registration.",
    "bring": [
      "Check the requirements for your profession and registration appointment"
    ],
    "apply": "https://online.prc.gov.ph/",
    "source": "https://www.prc.gov.ph/sites/default/files/LERIS%20Online%20-%20Step%20by%20Step.pdf",
    "position": 14
  },
  {
    "slug": "owwa-ecard",
    "name": "OWWA e-Card",
    "agency": "OWWA",
    "category": "Work IDs",
    "summary": "For eligible overseas Filipino workers.",
    "bring": [
      "Check your OWWA membership and applicable documentary requirements"
    ],
    "apply": "https://ecard.owwa.gov.ph/",
    "source": "https://ecard.owwa.gov.ph/faqs/",
    "position": 15
  },
  {
    "slug": "seafarer-id",
    "name": "Seafarer’s Identity Document / Record Book",
    "agency": "MARINA",
    "category": "Work IDs",
    "summary": "For eligible seafarers. Check the current appointment process with MARINA.",
    "bring": [
      "MARINA appointment and documents for the selected credential"
    ],
    "apply": "https://sidsrb.marina.gov.ph/",
    "source": "https://marina.gov.ph/frequently-asked-questions-faqs/",
    "position": 16
  },
  {
    "slug": "senior-citizen-id",
    "name": "Senior Citizen ID",
    "agency": "Local OSCA",
    "category": "Eligibility-based IDs",
    "summary": "For eligible applicants aged 60 and above.",
    "bring": [
      "Proof of age and residence",
      "Check local OSCA application instructions"
    ],
    "apply": "https://quezoncity.gov.ph/qcitizen-guides/how-to-apply-for-senior-citizen-card/",
    "source": "https://quezoncity.gov.ph/departments/office-for-the-senior-citizens-affairs/",
    "position": 17
  },
  {
    "slug": "acr-i-card",
    "name": "ACR I-Card",
    "agency": "Bureau of Immigration",
    "category": "Eligibility-based IDs",
    "summary": "For eligible foreign nationals under immigration rules.",
    "bring": [
      "Check documents for your immigration status or visa category"
    ],
    "apply": "https://immigration.gov.ph/",
    "source": "https://immigration.gov.ph/faqs/",
    "position": 18
  },
  {
    "slug": "voter-registration",
    "name": "Voter registration and certification",
    "agency": "COMELEC",
    "category": "Supporting documents",
    "summary": "Register during an open registration period. Registered voters can ask about a Voter’s Certification. Physical Voter’s ID issuance was suspended.",
    "bring": [
      "Accepted proof of identity for voter registration",
      "Ask the election office about certification after registration"
    ],
    "apply": "https://www.comelec.gov.ph/?r=VoterRegistration",
    "source": "https://www.comelec.gov.ph/?r=AboutCOMELEC%2FCitizensCharter%2FFrontlineServices%2FVotersGeneralPublic",
    "position": 19
  },
  {
    "slug": "birth-certificate",
    "name": "PSA birth certificate",
    "agency": "PSA",
    "category": "Supporting documents",
    "summary": "Civil registry document used in many first-ID applications.",
    "bring": [
      "Check PSA’s identification and appointment requirements for requesting your copy"
    ],
    "apply": "https://www.psaserbilis.com.ph/",
    "source": "https://psa.gov.ph/birth-certificate",
    "position": 20
  },
  {
    "slug": "barangay-certificates",
    "name": "Barangay residency and first-time jobseeker certificates",
    "agency": "Barangay hall",
    "category": "Supporting documents",
    "summary": "Ask your barangay about a residency certificate or a first-time jobseeker certification. These serve different purposes.",
    "bring": [
      "Ask your barangay for local requirements",
      "For jobseeker benefits, ask about the certification and oath of undertaking"
    ],
    "apply": "https://www.csc.gov.ph/csc-gov-t-agencies-sign-implementing-guidelines-for-first-time-jobseekers-law",
    "source": "https://phlpost.gov.ph/cpt-press-releases/phlpost-simplifies-postal-id-application-for-all/",
    "position": 21
  },
  {
    "slug": "nbi-clearance",
    "name": "NBI Clearance",
    "agency": "NBI",
    "category": "Supporting documents",
    "summary": "A background clearance often requested for work. Eligible first-time jobseekers have a dedicated application portal.",
    "bring": [
      "Bring the identity documents listed by NBI",
      "First-time jobseekers should check the barangay certification and oath requirements"
    ],
    "apply": "https://firsttimejobseekers.nbi.gov.ph/",
    "source": "https://nbi.gov.ph/citizens-charter/nbi-clearance-first-time-job-seekers/",
    "position": 22
  },
  {
    "slug": "police-clearance",
    "name": "National Police Clearance",
    "agency": "PNP",
    "category": "Supporting documents",
    "summary": "A police clearance commonly requested for employment or other specific transactions.",
    "bring": [
      "Online appointment and required identity documents",
      "Follow payment or applicable fee waiver instructions"
    ],
    "apply": "https://pnpclearance.ph/",
    "source": "https://ncrpo.pnp.gov.ph/wp-content/uploads/2024/12/NPCS-CITIZENS-CHARTER-HANDBOOK-CY-2024_1.pdf",
    "position": 23
  }
]
$catalog$::jsonb)
on conflict (slug) do nothing;
