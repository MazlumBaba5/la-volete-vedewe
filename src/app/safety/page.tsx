export default function SafetyPage() {
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
            Trust & Safety
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Safety & Community Guidelines</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: '#d1d5db' }}>
            LvvD is a neutral advertising platform. We promote a legal, transparent, and respectful environment for all independent users. While we do not participate in or monitor private interactions, we encourage our community to adopt best practices for personal safety:
          </p>

          <ul className="mt-8 space-y-4 pl-5 text-sm" style={{ color: '#d1d5db' }}>
            <li className="list-disc leading-7">
              <strong className="text-white">Independence:</strong> All users (Advisors and Guests) operate as independent parties. LvvD is not an agency and does not provide physical locations or security.
            </li>
            <li className="list-disc leading-7">
              <strong className="text-white">Vetting:</strong> Users are encouraged to independently verify profile details and maintain clear, respectful communication through their preferred private channels.
            </li>
            <li className="list-disc leading-7">
              <strong className="text-white">Personal Safety:</strong> We suggest meeting in environments where you feel secure. Always notify a trusted person of your general plans.
            </li>
            <li className="list-disc leading-7">
              <strong className="text-white">Data Privacy:</strong> To prevent fraud, never share sensitive financial information or identity documents directly with other users.
            </li>
            <li className="list-disc leading-7">
              <strong className="text-white">Reporting:</strong> Help us maintain a clean marketplace. Report any suspicious behavior, scams, or illegal content through our support channels.
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
