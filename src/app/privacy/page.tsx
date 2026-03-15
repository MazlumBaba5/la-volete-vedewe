import { LEGAL_DETAILS, LEGAL_PLACEHOLDER_NOTICE } from '@/lib/legal'

const sections = [
  {
    title: '1. WHO WE ARE',
    paragraphs: [
      `${LEGAL_DETAILS.brandName} operates ${LEGAL_DETAILS.websiteUrl} as a launch-phase adult advertising platform.`,
      `Until formal company registration is completed, the data controller is ${LEGAL_DETAILS.ownerName}, ${LEGAL_DETAILS.ownerAddress}, contact email ${LEGAL_DETAILS.legalEmail}.`,
    ],
  },
  {
    title: '2. WHAT DATA WE COLLECT',
    paragraphs: [
      'We may process account details, contact data, profile information, uploaded photos, verification materials, technical logs, device/browser data, and payment-related metadata.',
      'For guest accounts, we may process email address, username, review submissions and activity required to operate the service.',
    ],
  },
  {
    title: '3. WHY WE PROCESS YOUR DATA',
    paragraphs: [
      'We process personal data to create and manage accounts, display advertisements, process verification requests, operate billing features, prevent abuse, enforce our Terms, and comply with legal obligations.',
      'We may also process limited data for site security, analytics, and customer support.',
    ],
  },
  {
    title: '4. LEGAL BASES',
    paragraphs: [
      'Depending on the context, we rely on contract performance, legitimate interests, consent, and legal obligations under applicable privacy law including the GDPR where relevant.',
    ],
  },
  {
    title: '5. VERIFICATION DATA',
    paragraphs: [
      'Verification selfies and proof images are collected to reduce scams, fake profiles, and illegal activity on the platform.',
      'These files are intended to be visible only to the internal LvvD review team and are not displayed on the public advisor profile.',
    ],
  },
  {
    title: '6. SHARING OF DATA',
    paragraphs: [
      'We may share data with service providers that help us operate the Website, such as hosting, database, storage, email, payments, and media infrastructure providers.',
      'We may disclose information where required by law or where necessary to investigate fraud, coercion, trafficking, or other illegal conduct.',
    ],
  },
  {
    title: '7. DATA RETENTION',
    paragraphs: [
      'We keep personal data only for as long as necessary for the purposes described in this policy, including fraud prevention, compliance, dispute handling, and accounting obligations.',
      'Pre-launch retention periods are provisional and should be finalized before launch.',
    ],
  },
  {
    title: '8. YOUR RIGHTS',
    paragraphs: [
      'Depending on your location, you may have the right to access, correct, delete, restrict, or object to certain processing of your personal data, and to withdraw consent where consent is the legal basis.',
      `You may contact us at ${LEGAL_DETAILS.legalEmail} to exercise your rights.`,
    ],
  },
  {
    title: '9. INTERNATIONAL TRANSFERS',
    paragraphs: [
      'Some service providers may process data outside your country. Where required, we will rely on appropriate safeguards such as contractual protections or equivalent mechanisms.',
    ],
  },
  {
    title: '10. CONTACT',
    paragraphs: [
      `Privacy questions can be sent to ${LEGAL_DETAILS.legalEmail}.`,
      `Future company details: ${LEGAL_DETAILS.companyName}, KVK ${LEGAL_DETAILS.kvkNumber}, VAT ${LEGAL_DETAILS.vatNumber}.`,
    ],
  },
] as const

export default function PrivacyPage() {
  return (
    <main className="px-4 lg:px-8 py-12">
      <div className="mx-auto max-w-4xl">
        <div
          className="rounded-[28px] p-8 lg:p-12"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
            border: '1px solid var(--border)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.24)',
          }}
        >
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
            Legal
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Privacy Policy</h1>
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            Last Updated: {LEGAL_DETAILS.updatedAt}
          </p>
          <div
            className="mt-5 rounded-2xl px-4 py-3 text-sm"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.24)', color: '#fde68a' }}
          >
            {LEGAL_PLACEHOLDER_NOTICE}
          </div>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7" style={{ color: '#d1d5db' }}>
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
