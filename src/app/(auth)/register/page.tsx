'use client';

import { useState } from 'react';
import Link from 'next/link';

type Role = 'guest' | 'advisor';

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('advisor');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    city: '',
    phone: '',
    agreeTerms: false,
    agreeAge: false,
  });
  const [success, setSuccess] = useState(false);

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black text-white">Registrazione completata!</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {role === 'advisor'
              ? 'Il tuo profilo è stato creato. Puoi ora accedere alla tua dashboard e pubblicare il tuo annuncio.'
              : 'Account creato con successo. Puoi ora sfogliare tutti i profili.'}
          </p>
          <Link href="/advisor/dashboard" className="btn-accent w-full justify-center py-3 text-sm block">
            Vai alla dashboard
          </Link>
          <Link href="/" className="btn-ghost w-full justify-center py-2.5 text-sm block">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8">
      <div
        className="w-full max-w-lg rounded-2xl p-8 space-y-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">Crea il tuo account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Unisciti alla community più grande d&apos;Italia
          </p>
        </div>

        {/* Role toggle */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          {([
            { value: 'advisor', label: '💃 Sono un&apos;accompagnatrice', sub: 'Pubblica il tuo annuncio' },
            { value: 'guest', label: '👤 Sono un cliente', sub: 'Sfoglia annunci' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRole(opt.value)}
              className="flex flex-col items-center py-3 px-2 rounded-lg transition-all text-center"
              style={{
                background: role === opt.value ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${role === opt.value ? 'var(--accent)' : 'transparent'}`,
              }}
            >
              <span className="text-sm font-semibold text-white"
                dangerouslySetInnerHTML={{ __html: opt.label }} />
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Step indicator */}
        {role === 'advisor' && (
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: step >= s ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: step >= s ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {s}
                </div>
                <span
                  className="text-xs"
                  style={{ color: step >= s ? '#d1d5db' : 'var(--text-muted)' }}
                >
                  {s === 1 ? 'Account' : 'Profilo'}
                </span>
                {s < 2 && (
                  <div
                    className="flex-1 h-px"
                    style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 – Account */}
        {(step === 1 || role === 'guest') && (
          <form onSubmit={role === 'advisor' ? handleNextStep : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="la-tua@email.it"
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Minimo 8 caratteri"
                className="input-dark"
              />
            </div>

            {/* Agreements */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.agreeAge}
                  onChange={(e) => update('agreeAge', e.target.checked)}
                  className="accent-pink-500 mt-0.5 shrink-0"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Dichiaro di avere almeno <strong className="text-gray-300">18 anni</strong> e di
                  essere maggiorenne nel mio paese di residenza.
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.agreeTerms}
                  onChange={(e) => update('agreeTerms', e.target.checked)}
                  className="accent-pink-500 mt-0.5 shrink-0"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Accetto i{' '}
                  <Link href="/termini" className="underline" style={{ color: 'var(--accent)' }}>
                    Termini di servizio
                  </Link>{' '}
                  e la{' '}
                  <Link href="/privacy" className="underline" style={{ color: 'var(--accent)' }}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full justify-center py-3 text-sm"
            >
              {role === 'advisor' ? 'Avanti →' : loading ? 'Registrazione…' : 'Crea account'}
            </button>
          </form>
        )}

        {/* Step 2 – Advisor profile details */}
        {step === 2 && role === 'advisor' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Nome (o pseudonimo)
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Sofia"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Città</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="Roma"
                  className="input-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Telefono{' '}
                <span style={{ color: 'var(--text-muted)' }}>(visibile solo agli utenti registrati)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+39 3XX XXX XXXX"
                className="input-dark"
              />
            </div>

            {/* Tier promo */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{
                background: 'rgba(233,30,140,0.07)',
                border: '1px solid rgba(233,30,140,0.2)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                💎 Ottieni più visibilità con Diamond
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                I profili Diamond appaiono sempre in cima ai risultati e ricevono il 3× delle
                visualizzazioni. Puoi fare l&apos;upgrade in qualsiasi momento dalla dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                ← Indietro
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent flex-1 py-2.5 text-sm"
              >
                {loading ? 'Registrazione…' : 'Completa registrazione'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Hai già un account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
