export default function ContactPage() {
  const officialEmail = 'lvvd_nl@hotmail.com'

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
            Support
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">Contact</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: '#d1d5db' }}>
            For platform support, verification questions, or legal requests, contact us at the email addresses below.
          </p>

          <div
            className="mt-6 rounded-2xl px-4 py-3 text-sm leading-6"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#fecaca' }}
          >
            <strong className="text-white">Important:</strong> {officialEmail} is the only original official LvvD email address.
            Please be careful with any other email address and treat it as potentially fraudulent.
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                General support
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{officialEmail}</p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                Legal / privacy
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{officialEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
