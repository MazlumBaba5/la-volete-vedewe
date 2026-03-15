import { LEGAL_DETAILS, LEGAL_PLACEHOLDER_NOTICE } from '@/lib/legal'

const sections = [
  {
    title: '1. WHAT THIS COOKIE STATEMENT COVERS',
    paragraphs: [
      `This Cookie Statement explains how ${LEGAL_DETAILS.brandName} uses cookies and similar technologies on ${LEGAL_DETAILS.websiteUrl}.`,
      'It is a pre-launch placeholder document and should be aligned with the final analytics, advertising, and consent setup before launch.',
    ],
  },
  {
    title: '2. STRICTLY NECESSARY COOKIES',
    paragraphs: [
      'We use essential cookies and similar storage technologies to keep the Website secure, maintain sessions, protect admin access, remember basic preferences, and support core features such as login.',
    ],
  },
  {
    title: '3. FUNCTIONAL COOKIES',
    paragraphs: [
      'Functional cookies may be used to remember settings such as language, session state, or interface preferences where applicable.',
    ],
  },
  {
    title: '4. ANALYTICS AND PERFORMANCE',
    paragraphs: [
      'If analytics tools are enabled, we may use cookies or equivalent identifiers to understand traffic, performance, and feature usage.',
      'Before launch, these tools and their legal basis should be reviewed and documented precisely.',
    ],
  },
  {
    title: '5. MARKETING OR THIRD-PARTY COOKIES',
    paragraphs: [
      'At the current stage, marketing and third-party advertising cookies should remain disabled unless a compliant consent setup is implemented.',
    ],
  },
  {
    title: '6. MANAGING COOKIES',
    paragraphs: [
      'You can control or delete cookies through your browser settings. Blocking some cookies may affect the proper functioning of the Website.',
      'If a consent banner is introduced later, this statement should be updated to match the exact categories and providers in use.',
    ],
  },
  {
    title: '7. CONTACT',
    paragraphs: [
      `Questions about cookies or consent can be sent to ${LEGAL_DETAILS.legalEmail}.`,
    ],
  },
] as const

export default function CookiesPage() {
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
          <h1 className="mt-3 text-4xl font-black text-white">Cookie Statement</h1>
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
