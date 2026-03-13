'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CityAutocomplete from '@/components/ui/CityAutocomplete';
import {
  ADVISOR_ETHNICITIES,
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_OPTIONS,
  BDSM_SERVICE_OPTIONS,
  buildRatesFromForm,
  createEmptyRateState,
  DATE_TYPE_OPTIONS,
  GENERAL_SERVICE_OPTIONS,
  MASSAGE_SERVICE_OPTIONS,
  PRICE_DURATION_OPTIONS,
  type PriceCode,
  SEX_ORIENTATION_OPTIONS,
  VIRTUAL_SERVICE_OPTIONS,
} from '@/lib/advisor-profile-options';

type Role = 'guest' | 'advisor';
type AdvisorCategory = 'woman' | 'man' | 'couple' | 'shemale';
type GenderType = 'female' | 'male' | 'shemale';
type RegisterForm = {
  email: string;
  password: string;
  name: string;
  advisorCategory: AdvisorCategory;
  age: string;
  ethnicity: string;
  gender: GenderType;
  city: string;
  region: string;
  bio: string;
  sexualOrientation: string;
  dateTypes: string[];
  servicesTags: string[];
  incallRates: Record<PriceCode, string>;
  outcallRates: Record<PriceCode, string>;
  availabilitySlots: string[];
  phone: string;
  whatsappAvailable: boolean;
  agreeTerms: boolean;
  agreeAge: boolean;
};

const TYPE_DATE_LABELS: Record<string, string> = {
  Incall: 'InCall',
  Outcall: 'OutCall',
  Massage: 'Massage',
  Bdsm: 'BDSM',
  SexCam: 'SexCam',
};

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function ServiceSection({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className="rounded-full px-3 py-1.5 text-xs transition-all"
              style={{
                background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                color: active ? '#fff' : '#cbd5e1',
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RatesEditor({
  title,
  values,
  onChange,
}: {
  title: string;
  values: Record<PriceCode, string>;
  onChange: (code: PriceCode, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {PRICE_DURATION_OPTIONS.map((option) => (
          <label key={option.code} className="space-y-1">
            <span className="block text-xs text-gray-400">{option.label}</span>
            <input
              type="number"
              min={0}
              value={values[option.code]}
              onChange={(e) => onChange(option.code, e.target.value)}
              placeholder="EUR"
              className="input-dark"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('advisor');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RegisterForm>({
    email: '',
    password: '',
    name: '',
    advisorCategory: 'woman',
    age: '',
    ethnicity: '',
    gender: 'female',
    city: '',
    region: '',
    bio: '',
    sexualOrientation: '',
    dateTypes: [],
    servicesTags: [],
    incallRates: createEmptyRateState(),
    outcallRates: createEmptyRateState(),
    availabilitySlots: [],
    phone: '',
    whatsappAvailable: false,
    agreeTerms: false,
    agreeAge: false,
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const hasBdsm = form.dateTypes.includes('Bdsm');
  const hasMassage = form.dateTypes.includes('Massage');
  const hasSexCam = form.dateTypes.includes('SexCam');
  const hasIncall = form.dateTypes.includes('Incall');
  const hasOutcall = form.dateTypes.includes('Outcall');

  function updateField<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleMultiField(key: 'dateTypes' | 'servicesTags' | 'availabilitySlots', value: string) {
    setForm((current) => ({ ...current, [key]: toggleValue(current[key], value) }));
  }

  function setRateValue(scope: 'incallRates' | 'outcallRates', code: PriceCode, value: string) {
    setForm((current) => ({
      ...current,
      [scope]: {
        ...current[scope],
        [code]: value,
      },
    }));
  }

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
          age: form.age ? Number(form.age) : null,
          ethnicity: form.ethnicity,
          gender: form.gender,
          city: form.city,
          region: form.region,
          bio: form.bio,
          sexualOrientation: form.sexualOrientation,
          dateTypes: form.dateTypes,
          servicesTags: form.servicesTags,
          incallRates: buildRatesFromForm(form.incallRates, 'incall'),
          outcallRates: buildRatesFromForm(form.outcallRates, 'outcall'),
          availabilitySlots: form.availabilitySlots,
          phone: form.phone,
          whatsappAvailable: form.whatsappAvailable,
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.error) {
        setError(json?.error ?? 'Registration failed. Please try again.');
      } else {
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          setSuccess(true);
        } else {
          router.push(role === 'advisor' ? '/advisor/dashboard' : '/guest/dashboard');
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-8">
      <div
        className="w-full max-w-5xl rounded-2xl p-8 space-y-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Join the largest community in the Netherlands
          </p>
        </div>

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
              <span className="text-sm font-semibold text-white" dangerouslySetInnerHTML={{ __html: opt.label }} />
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>

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
                <span className="text-xs" style={{ color: step >= s ? '#d1d5db' : 'var(--text-muted)' }}>
                  {s === 1 ? 'Account' : 'Advisor Profile'}
                </span>
                {s < 2 && (
                  <div className="flex-1 h-px" style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }} />
                )}
              </div>
            ))}
          </div>
        )}

        {(step === 1 || role === 'guest') && (
          <form onSubmit={role === 'advisor' ? handleNextStep : handleSubmit} className="space-y-4 max-w-lg mx-auto w-full">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="your@email.com" className="input-dark" />
            </div>
            {role === 'guest' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
                <input type="text" required minLength={3} value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="yourusername" className="input-dark" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="At least 8 characters" className="input-dark" />
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" required checked={form.agreeAge} onChange={(e) => updateField('agreeAge', e.target.checked)} className="accent-pink-500 mt-0.5 shrink-0" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  I confirm I am at least <strong className="text-gray-300">18 years old</strong> and of legal age in my country of residence.
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" required checked={form.agreeTerms} onChange={(e) => updateField('agreeTerms', e.target.checked)} className="accent-pink-500 mt-0.5 shrink-0" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  I agree to the <Link href="/terms" className="underline" style={{ color: 'var(--accent)' }}>Terms & Conditions</Link> and the <Link href="/privacy" className="underline" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
                </span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-accent w-full justify-center py-3 text-sm">
              {role === 'advisor' ? 'Next →' : loading ? 'Creating account…' : 'Create account'}
            </button>

            {error && role === 'guest' && (
              <p className="text-xs text-center px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </p>
            )}
          </form>
        )}

        {step === 2 && role === 'advisor' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Identity</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Name / Alias</label>
                  <input type="text" required value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Sofia" className="input-dark" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Age</label>
                    <input type="number" min={18} max={80} required value={form.age} onChange={(e) => updateField('age', e.target.value)} className="input-dark" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Gender</label>
                    <select value={form.gender} onChange={(e) => updateField('gender', e.target.value as GenderType)} className="input-dark">
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="shemale">Shemale / Trans</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Ethnicity</label>
                    <select required value={form.ethnicity} onChange={(e) => updateField('ethnicity', e.target.value)} className="input-dark">
                      <option value="">Select ethnicity</option>
                      {ADVISOR_ETHNICITIES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Sex orientation</label>
                    <select required value={form.sexualOrientation} onChange={(e) => updateField('sexualOrientation', e.target.value)} className="input-dark">
                      <option value="">Select orientation</option>
                      {SEX_ORIENTATION_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Listing category</label>
                  <select value={form.advisorCategory} onChange={(e) => updateField('advisorCategory', e.target.value as AdvisorCategory)} className="input-dark">
                    <option value="woman">Woman</option>
                    <option value="man">Man</option>
                    <option value="couple">Couple</option>
                    <option value="shemale">Shemale</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 rounded-xl p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Location & profile</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
                  <CityAutocomplete city={form.city} region={form.region} required onChange={(city, region) => setForm((current) => ({ ...current, city, region }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Region</label>
                  <input type="text" readOnly value={form.region} placeholder="Auto-filled when city is selected" className="input-dark opacity-70" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                  <textarea rows={6} required value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Describe your profile, style and what clients can expect..." className="input-dark resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+31 6XX XXX XXXX" className="input-dark" />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.whatsappAvailable}
                    onChange={(e) => updateField('whatsappAvailable', e.target.checked)}
                    className="accent-pink-500"
                  />
                  <span className="text-sm text-gray-300">WhatsApp available</span>
                </label>
              </div>
            </div>

            <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Type of date</h3>
              <div className="flex flex-wrap gap-2">
                {DATE_TYPE_OPTIONS.map((item) => {
                  const active = form.dateTypes.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleMultiField('dateTypes', item)}
                      className="rounded-full px-4 py-2 text-sm transition-all"
                      style={{
                        background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-card)',
                        border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                        color: active ? '#fff' : '#cbd5e1',
                      }}
                    >
                      {TYPE_DATE_LABELS[item]}
                    </button>
                  );
                })}
              </div>
            </div>

            {(hasIncall || hasOutcall) && (
              <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Prices</h3>
                {hasIncall && <RatesEditor title="InCall prices" values={form.incallRates} onChange={(code, value) => setRateValue('incallRates', code, value)} />}
                {hasOutcall && <RatesEditor title="OutCall prices" values={form.outcallRates} onChange={(code, value) => setRateValue('outcallRates', code, value)} />}
              </div>
            )}

            <div className="rounded-xl p-6 space-y-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Services available</h3>
              <ServiceSection title="General services" items={GENERAL_SERVICE_OPTIONS} selected={form.servicesTags} onToggle={(value) => toggleMultiField('servicesTags', value)} />
              {hasBdsm && <ServiceSection title="BDSM services" items={BDSM_SERVICE_OPTIONS} selected={form.servicesTags} onToggle={(value) => toggleMultiField('servicesTags', value)} />}
              {hasMassage && <ServiceSection title="Erotic massage services" items={MASSAGE_SERVICE_OPTIONS} selected={form.servicesTags} onToggle={(value) => toggleMultiField('servicesTags', value)} />}
              {hasSexCam && <ServiceSection title="Virtual sex services" items={VIRTUAL_SERVICE_OPTIONS} selected={form.servicesTags} onToggle={(value) => toggleMultiField('servicesTags', value)} />}
            </div>

            <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Availability</h3>
              <div className="space-y-4">
                {AVAILABILITY_DAYS.map((day) => (
                  <div key={day} className="space-y-2">
                    <p className="text-sm font-medium text-white">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_TIME_OPTIONS.map((slot) => {
                        const value = `${day} - ${slot}`;
                        const active = form.availabilitySlots.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleMultiField('availabilitySlots', value)}
                            className="rounded-full px-3 py-1.5 text-xs transition-all"
                            style={{
                              background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-card)',
                              border: `1px solid ${active ? 'rgba(233,30,140,0.45)' : 'var(--border)'}`,
                              color: active ? '#fff' : '#cbd5e1',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(233,30,140,0.07)', border: '1px solid rgba(233,30,140,0.2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Age and ethnicity become locked after the first save.</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Review those fields carefully before completing registration.
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-2.5 text-sm">← Back</button>
              <button type="submit" disabled={loading} className="btn-accent flex-1 py-2.5 text-sm">
                {loading ? 'Creating account…' : 'Complete registration'}
              </button>
            </div>

            {error && (
              <p className="text-xs text-center px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </p>
            )}
          </form>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
