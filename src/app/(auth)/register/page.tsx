'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CityAutocomplete from '@/components/ui/CityAutocomplete';

type Role = 'guest' | 'advisor';
type AdvisorCategory = 'woman' | 'man' | 'couple' | 'shemale';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('advisor');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    advisorCategory: 'woman' as AdvisorCategory,
    city: '',
    region: '',
    phone: '',
    agreeTerms: false,
    agreeAge: false,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role,
          name: form.name,
          advisorCategory: form.advisorCategory,
          city: form.city,
          region: form.region,
          phone: form.phone,
        }),
      })

      const json = await res.json()
      if (!res.ok || json?.error) {
        setError(json?.error ?? 'Registration failed. Please try again.')
      } else {
        // Sign in the user to establish session
        const supabase = createClient()
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (signInError) {
          // Sign-in failed – show success so user can log in manually
          setSuccess(true)
        } else {
          // Auto-redirect based on role
          router.push(role === 'advisor' ? '/advisor/dashboard' : '/guest/dashboard')
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  };

  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black text-white">Registration complete!</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {role === 'advisor'
              ? 'Your profile has been created. You can now access your dashboard and post your listing.'
              : 'Account created successfully. You can now browse all listings.'}
          </p>
          <Link
            href={role === 'advisor' ? '/advisor/dashboard' : '/guest/dashboard'}
            className="btn-accent w-full justify-center py-3 text-sm block"
          >
            Go to dashboard
          </Link>
          <Link href="/" className="btn-ghost w-full justify-center py-2.5 text-sm block">
            Back to home
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
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Join the largest community in Netherlands
          </p>
        </div>

        {/* Role toggle */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          {([
            { value: 'advisor', label: '💃 I&apos;m an escort', sub: 'Post your listing' },
            { value: 'guest', label: '👤 I&apos;m a client', sub: 'Browse listings' },
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
                  {s === 1 ? 'Account' : 'Profile'}
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
                placeholder="your@email.com"
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
                placeholder="At least 8 characters"
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
                  I confirm I am at least <strong className="text-gray-300">18 years old</strong> and
                  of legal age in my country of residence.
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
                  I agree to the{' '}
                  <Link href="/terms" className="underline" style={{ color: 'var(--accent)' }}>
                    Terms of Service
                  </Link>{' '}
                  and the{' '}
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
              {role === 'advisor' ? 'Next →' : loading ? 'Creating account…' : 'Create account'}
            </button>

            {error && role === 'guest' && (
              <p
                className="text-xs text-center px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {error}
              </p>
            )}
          </form>
        )}

        {/* Step 2 – Advisor profile details */}
        {step === 2 && role === 'advisor' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Name (or alias)
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
                <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
                <CityAutocomplete
                  city={form.city}
                  region={form.region}
                  required
                  onChange={(city, region) => setForm((f) => ({ ...f, city, region }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Listing category</label>
              <select
                value={form.advisorCategory}
                onChange={(e) => update('advisorCategory', e.target.value as AdvisorCategory)}
                className="input-dark"
              >
                <option value="woman">Woman</option>
                <option value="man">Man</option>
                <option value="couple">Couple</option>
                <option value="shemale">Shemale</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Phone{' '}
                <span style={{ color: 'var(--text-muted)' }}>(visible to registered users only)</span>
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
                💎 Get more visibility with Diamond
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Diamond profiles always appear at the top of results and get 3× the views. You can upgrade at any time from the dashboard.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent flex-1 py-2.5 text-sm"
              >
                {loading ? 'Creating account…' : 'Complete registration'}
              </button>
            </div>

            {error && (
              <p
                className="text-xs text-center px-3 py-2 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {error}
              </p>
            )}
          </form>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
