const steps = [
  {
    title: '1. Create an account',
    text: 'Advisors register and set up their profile with photos, city, services and rates. Guest accounts can browse, save favorites and interact with platform features.',
  },
  {
    title: '2. Browse or publish listings',
    text: 'Visitors can search listings by city, category and services. Advisors can manage their listing details from their dashboard.',
  },
  {
    title: '3. Connect safely',
    text: 'Users contact profiles directly through the available contact options. We recommend using clear boundaries, safe meeting practices and respectful communication.',
  },
  {
    title: '4. Keep your profile updated',
    text: 'Advisors can update services, availability and media to keep information accurate for visitors.',
  },
] as const

export default function HowItWorksPage() {
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
            Guide
          </p>
          <h1 className="mt-3 text-4xl font-black text-white">How it works</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: '#d1d5db' }}>
            LvvD is an advertising platform where adults can publish and discover listings. Below is a quick overview of the typical flow.
          </p>

          <div className="mt-10 space-y-8">
            {steps.map((step) => (
              <section key={step.title} className="space-y-3">
                <h2 className="text-lg font-bold text-white">{step.title}</h2>
                <p className="text-sm leading-7" style={{ color: '#d1d5db' }}>
                  {step.text}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
