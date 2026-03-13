import { LEGAL_DETAILS, LEGAL_PLACEHOLDER_NOTICE } from '@/lib/legal'

const sections = [
  {
    title: '1. OWNERSHIP AND CORPORATE DATA',
    paragraphs: [
      `1.1 The Website is currently offered and operated as a launch-phase project by ${LEGAL_DETAILS.brandName}.`,
      `1.2 Until formal corporate registration (KVK), the responsible party for the Website is ${LEGAL_DETAILS.ownerName}, located at ${LEGAL_DETAILS.ownerAddress}, Email: ${LEGAL_DETAILS.legalEmail}.`,
      `1.3 These Terms shall remain valid and binding upon the future transfer of the Website’s operations to a legal entity (${LEGAL_DETAILS.companyName}, B.V., Ltd, or equivalent) once registered.`,
    ],
  },
  {
    title: '2. AGE REQUIREMENTS AND VERIFICATION',
    paragraphs: [
      '2.1 Visitors: You must be at least 18 years of age to visit or browse the Website.',
      '2.2 Advertisers: You must be at least 21 years of age to create an account and post advertisements.',
      '2.3 Verification: LvvD reserves the right to verify your age at any time. We may request a copy of a valid government-issued ID. Failure to provide such proof or the provision of fraudulent documentation will result in the immediate termination of your Account.',
    ],
  },
  {
    title: '3. DESCRIPTION OF SERVICES',
    paragraphs: [
      '3.1 LvvD provides an online advertising platform where Advertisers can list erotic and/or sexual services and Visitors can contact them.',
      '3.2 Intermediary Role Only: LvvD acts strictly as a hosting provider. We are not involved in, nor responsible for, any agreements, transactions, or physical meetings between Users. We do not provide erotic services ourselves and do not act as an agency for the Advertisers.',
    ],
  },
  {
    title: '4. USER CONDUCT AND CONTENT RULES',
    paragraphs: [
      '4.1 Users are solely responsible for the content they post. It is strictly prohibited to post content that:',
    ],
    bullets: [
      'Violates any local or international laws;',
      'Refers to human trafficking, forced prostitution, or involuntary services;',
      'Involves minors or child sexual abuse material (Zero Tolerance Policy);',
      'Contains hate speech, threats, or incitement to violence.',
      '4.2 LvvD reserves the right to remove, edit, or refuse any content that violates these Terms without prior notice.',
    ],
  },
  {
    title: '5. ZERO TOLERANCE POLICY',
    paragraphs: [
      '5.1 LvvD maintains a zero-tolerance policy regarding illegal activities in the adult industry. If we suspect any form of coercion, underage involvement, or illegal conduct, we will immediately terminate the Account and cooperate fully with law enforcement agencies, including where legally required by providing IP addresses and identification data.',
    ],
  },
  {
    title: '6. INTELLECTUAL PROPERTY',
    paragraphs: [
      '6.1 All design, text, graphics, and logos related to LvvD are the property of the Website owner unless otherwise stated.',
      '6.2 By posting content (photos/videos), the Advertiser grants LvvD a non-exclusive, royalty-free license to display such material on the Website for the duration of the advertisement. The Advertiser guarantees they own the copyright to all uploaded material or have the necessary rights to publish it.',
    ],
  },
  {
    title: '7. LIMITATION OF LIABILITY',
    paragraphs: [
      '7.1 LvvD does not guarantee that the Website will be error-free or uninterrupted.',
      '7.2 To the maximum extent permitted by law, LvvD shall not be liable for any indirect, incidental, or consequential damages arising from the use of the service.',
      '7.3 Our total liability for any claim shall not exceed EUR 25 per event.',
    ],
  },
  {
    title: '8. PAYMENTS AND CREDITS',
    paragraphs: [
      '8.1 Certain services require payment. All prices are in Euros and inclusive of VAT where applicable.',
      '8.2 Credit bundles purchased on the Website are non-refundable and cannot be exchanged for cash, except where mandatory law provides otherwise.',
    ],
  },
  {
    title: '9. GOVERNING LAW',
    paragraphs: [
      '9.1 These Terms are governed by and construed in accordance with the laws of The Netherlands, or, until formal registration, the laws applicable to the registered owner. Any disputes shall be submitted to the exclusive jurisdiction of the competent courts in the owner’s region, unless mandatory law requires otherwise.',
    ],
  },
] as const

export default function TermsPage() {
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
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
              Legal
            </p>
            <h1 className="mt-3 text-4xl font-black text-white">Terms & Conditions</h1>
            <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Last Updated: {LEGAL_DETAILS.updatedAt}
            </p>
            <div
              className="mt-5 rounded-2xl px-4 py-3 text-sm"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.24)', color: '#fde68a' }}
            >
              {LEGAL_PLACEHOLDER_NOTICE}
            </div>
            <p className="mt-6 text-sm leading-7" style={{ color: '#d1d5db' }}>
              These General Terms and Conditions govern the access to and use of the website {LEGAL_DETAILS.websiteUrl}.
              By accessing or using the Website, you agree to be bound by these Terms. We recommend that you read them carefully.
            </p>
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
                {section.bullets && (
                  <ul className="space-y-2 pl-5 text-sm" style={{ color: '#d1d5db' }}>
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc leading-7">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
