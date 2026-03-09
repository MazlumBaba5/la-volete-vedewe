'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { TierBadge } from '@/components/ui/Badge';

// Mock: pretend the logged-in advisor is "Sofia"
const ME = MOCK_PROFILES[0];

const STATS = [
  { label: 'Views (7d)', value: '1.240', delta: '+18%', up: true },
  { label: 'Contacts received', value: '47', delta: '+5', up: true },
  { label: 'Unread messages', value: '3', delta: '', up: false },
  { label: 'Position in results', value: '#2', delta: '↑ 1', up: true },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'subscription' | 'settings'>('overview');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {/* Dashboard header */}
      <header
        className="px-4 lg:px-8 h-14 flex items-center justify-between"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        <Link href="/">
          <span
            className="text-xl font-black"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #ff6eb4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EscortItalia
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full overflow-hidden"
              style={{ border: '1.5px solid var(--accent)' }}
            >
              <img src={ME.photos[0]?.url} alt={ME.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-gray-200 hidden sm:block">{ME.name}</span>
          </div>
          <Link href="/" className="btn-ghost text-xs px-3 py-1.5">
            Sign out
          </Link>
        </div>
      </header>

      <div className="flex" style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col w-56 shrink-0 min-h-[calc(100vh-3.5rem)] py-6 px-4 gap-1"
          style={{ borderRight: '1px solid var(--border)' }}
        >
          {(
            [
              { id: 'overview', icon: '📊', label: 'Overview' },
              { id: 'profile', icon: '👤', label: 'My profile' },
              { id: 'subscription', icon: '💎', label: 'Subscription' },
              { id: 'settings', icon: '⚙️', label: 'Settings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={{
                background: activeTab === tab.id ? 'rgba(233,30,140,0.12)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent)' : '#9ca3af',
                border: `1px solid ${activeTab === tab.id ? 'rgba(233,30,140,0.25)' : 'transparent'}`,
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}

          <div className="flex-1" />

          <Link
            href={`/profilo/${ME.slug}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View public profile
          </Link>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8 py-8 min-w-0">
          {/* Mobile tabs */}
          <div className="flex gap-1 overflow-x-auto pb-4 lg:hidden">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'profile', label: 'Profile' },
                { id: 'subscription', label: 'Subscription' },
                { id: 'settings', label: 'Settings' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: activeTab === tab.id ? 'var(--accent)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? '#fff' : '#9ca3af',
                  border: `1px solid ${activeTab === tab.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcome */}
              <div>
                <h1 className="text-2xl font-black text-white">
                  Hello, {ME.name}! 👋
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Here’s a summary of your activity
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-5"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      {s.label}
                    </p>
                    <p className="text-3xl font-black text-white">{s.value}</p>
                    {s.delta && (
                      <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: s.up ? 'var(--success)' : '#ef4444' }}
                      >
                        {s.delta}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Profile status */}
              <div
                className="rounded-xl p-6 flex flex-col sm:flex-row gap-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                  style={{ border: '2px solid var(--accent)' }}
                >
                  <img
                    src={ME.photos[0]?.url}
                    alt={ME.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {ME.name}, {ME.age}
                    </h2>
                    <TierBadge level={ME.subscriptionLevel} />
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(34,197,94,0.15)',
                        color: 'var(--success)',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      ✓ Listing active
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {ME.city} · {ME.nationality} · {ME.views.toLocaleString()} total views
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="btn-outline text-xs px-3 py-1.5"
                    >
                      Edit profile
                    </button>
                    <Link
                      href={`/profilo/${ME.slug}`}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      View listing
                    </Link>
                  </div>
                </div>
              </div>

              {/* Upgrade promo */}
              {ME.subscriptionLevel !== 'diamond' && (
                <div
                  className="rounded-xl p-6 relative overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,58,237,0.1))',
                    border: '1px solid rgba(233,30,140,0.25)',
                  }}
                >
                  <h3 className="text-lg font-bold text-white mb-2">
                    🚀 Go Diamond and triple your views
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                    Diamond profiles always appear at the top and receive on average 3× more contact requests.
                  </p>
                  <button
                    onClick={() => setActiveTab('subscription')}
                    className="btn-accent text-sm px-6 py-2.5"
                  >
                    Discover Diamond →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Profile edit tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <h1 className="text-2xl font-black text-white">Edit profile</h1>

              <div
                className="rounded-xl p-6 space-y-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                {/* Foto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Profile photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden"
                      style={{ border: '2px solid var(--accent)' }}
                    >
                      <img src={ME.photos[0]?.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button className="btn-ghost text-sm px-4 py-2">
                      📷 Upload photo
                    </button>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Max 10 foto · JPG/PNG/WebP
                    </p>
                  </div>
                </div>

                {[
                  { label: 'Name / Alias', value: ME.name, type: 'text' },
                  { label: 'City', value: ME.city, type: 'text' },
                  { label: 'District / Area', value: ME.district ?? '', type: 'text' },
                  { label: 'Phone', value: ME.phone, type: 'tel' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      className="input-dark"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    defaultValue={ME.description}
                    rows={5}
                    className="input-dark resize-none"
                  />
                </div>

                <button className="btn-accent px-6 py-2.5 text-sm">
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* Subscription tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6 max-w-3xl">
              <h1 className="text-2xl font-black text-white">Subscription</h1>

              <div className="grid sm:grid-cols-3 gap-4">
                {(
                  [
                    {
                      level: 'free',
                      name: 'Standard',
                      price: '€0',
                      period: '',
                      features: [
                        '1 photo',
                        'Base position',
                        'Visible in results',
                        'No badge',
                      ],
                      cta: 'Current plan',
                      current: ME.subscriptionLevel === 'free',
                    },
                    {
                      level: 'premium',
                      name: 'Premium',
                      price: '€29',
                      period: '/ mese',
                      features: [
                        'Up to 5 photos',
                        'Priority position',
                        'Badge ⭐ Premium',
                        'Advanced statistics',
                      ],
                      cta: 'Upgrade to Premium',
                      current: ME.subscriptionLevel === 'premium',
                    },
                    {
                      level: 'diamond',
                      name: 'Diamond',
                      price: '€59',
                      period: '/ mese',
                      features: [
                        'Unlimited photos',
                        'Top of results',
                        'Badge 💎 Diamond',
                        'Full statistics',
                        'Priority support',
                      ],
                      cta: 'Upgrade to Diamond',
                      current: ME.subscriptionLevel === 'diamond',
                      highlight: true,
                    },
                  ] as const
                ).map((plan) => (
                  <div
                    key={plan.level}
                    className="rounded-xl p-5 flex flex-col gap-4"
                    style={{
                      background: plan.highlight
                        ? 'linear-gradient(135deg, rgba(233,30,140,0.1), rgba(124,58,237,0.1))'
                        : 'var(--bg-card)',
                      border: `1px solid ${plan.highlight ? 'rgba(233,30,140,0.4)' : plan.current ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                    }}
                  >
                    {plan.highlight && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full self-start"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        RECOMMENDED
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-white">{plan.name}</h3>
                      <p className="text-2xl font-black text-white mt-1">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-400">{plan.period}</span>
                      </p>
                    </div>
                    <ul className="space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-sm"
                          style={{ color: '#d1d5db' }}
                        >
                          <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={plan.current ? 'btn-ghost text-sm py-2 cursor-default' : 'btn-accent text-sm py-2'}
                      disabled={plan.current}
                    >
                      {plan.current ? '✓ Current plan' : plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Secure payment via Stripe · Cancel anytime · No commitments
              </p>
            </div>
          )}

          {/* Settings tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h1 className="text-2xl font-black text-white">Settings</h1>

              <div
                className="rounded-xl p-6 space-y-5"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-semibold text-gray-200">Account security</h3>
                {[
                  { label: 'Email', value: 'sofia@example.com', type: 'email' },
                  { label: 'New password', value: '', type: 'password', placeholder: '••••••••' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      placeholder={field.placeholder}
                      className="input-dark"
                    />
                  </div>
                ))}
                <button className="btn-outline text-sm px-4 py-2">
                  Update security
                </button>
              </div>

              <div
                className="rounded-xl p-6 space-y-4"
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <h3 className="font-semibold" style={{ color: '#fca5a5' }}>
                  Danger zone
                </h3>
                <p className="text-sm text-gray-400">
                  Deleting your account will permanently remove all your data.
                </p>
                <button
                  className="text-sm px-4 py-2 rounded-lg border transition-all"
                  style={{
                    background: 'transparent',
                    borderColor: 'rgba(239,68,68,0.4)',
                    color: '#f87171',
                  }}
                >
                  Delete account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
