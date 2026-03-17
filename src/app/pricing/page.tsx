const plans = [
  {
    name: 'Standard',
    price: 'EUR 0',
    period: '/ 30 days',
    details: 'Basic listing visibility with core profile management features.',
  },
  {
    name: 'Premium',
    price: 'EUR 29',
    period: '/ 30 days',
    details: 'Boosted visibility and access to enhanced profile promotion tools.',
  },
  {
    name: 'Diamond',
    price: 'EUR 59',
    period: '/ 30 days',
    details: 'Highest visibility tier with priority placement across key sections.',
  },
] as const

const clientPlan = {
  name: 'Gold',
  price: 'EUR 7',
  period: '/ 30 days',
  details:
    'Unlock 30 days of live chat access with Premium and Diamond advisors for registered client accounts, with the ability to leave reviews on advisor profiles.',
} as const

export default function PricingPage() {
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
          <div
            className="rounded-2xl px-4 py-3 text-sm leading-6"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', color: '#bbf7d0' }}
          >
            Payments are processed through the secure Stripe gateway with industry-standard encryption and protected checkout flows.
            {' '}
            <a
              href="https://docs.stripe.com/security/stripe"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Learn more on Stripe Security
            </a>
            .
          </div>

          <h1 className="mt-8 text-4xl font-black text-white">Pricing</h1>
          <p className="mt-6 text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
            Advisors Plans
          </p>
          <h2 className="mt-6 text-2xl font-black text-white">Advisors</h2>
          <p className="mt-4 text-sm leading-7" style={{ color: '#d1d5db' }}>
            Advisors can start with a free listing and optionally upgrade for more exposure.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-2xl p-5"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                  {plan.name}
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <h2 className="text-2xl font-black text-white">{plan.price}</h2>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {plan.period}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: '#d1d5db' }}>
                  {plan.details}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 border-t pt-10" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
              CLients Plans
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Clients</h2>
            <p className="mt-3 text-sm leading-7" style={{ color: '#d1d5db' }}>
              Clients can upgrade from free access to Gold to unlock direct live chat privileges.
            </p>

            <article
              className="mt-6 rounded-2xl p-6"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                {clientPlan.name}
              </p>
              <div className="mt-2 flex items-end gap-2">
                <h3 className="text-3xl font-black text-white">{clientPlan.price}</h3>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {clientPlan.period}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6" style={{ color: '#d1d5db' }}>
                {clientPlan.details}
              </p>
            </article>
          </div>
        </div>
      </div>
    </main>
  )
}
