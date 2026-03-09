'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Profile, type ProfilePhoto } from '@/types';
import { TierBadge, VerifiedBadge } from '@/components/ui/Badge';
import ContactModal from '@/components/marketplace/ContactModal';
import ProfileCard from '@/components/marketplace/ProfileCard';

interface Props {
  profile: Profile;
  related: Profile[];
}

export default function ProfileDetail({ profile, related }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProfilePhoto | undefined>(
    profile.photos.find((p: ProfilePhoto) => p.isMain) ?? profile.photos[0]
  );
  const [showContact, setShowContact] = useState(false);

  const availabilityColor: Record<string, string> = {
    available: 'var(--success)',
    busy: '#f59e0b',
    offline: '#6b7280',
  };

  const availabilityLabel: Record<string, string> = {
    available: 'Available',
    busy: 'Busy',
    offline: 'Offline',
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {/* Breadcrumb */}
      <div
        className="px-4 lg:px-8 py-3 text-sm"
        style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <nav className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link href="/listings" className="hover:text-white transition-colors">
            Listings
          </Link>
          <span>›</span>
          <Link
            href={`/listings?city=${encodeURIComponent(profile.city)}`}
            className="hover:text-white transition-colors"
          >
            {profile.city}
          </Link>
          <span>›</span>
          <span className="text-gray-300">
            {profile.name}
          </span>
        </nav>
      </div>

      <div
        className="px-4 lg:px-8 py-8"
        style={{ maxWidth: 1400, margin: '0 auto' }}
      >
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Photo gallery */}
            <div className="space-y-3">
              {/* Main photo */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ paddingBottom: '66%' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto?.url}
                  alt={profile.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {profile.subscriptionLevel !== 'free' && (
                  <div className="absolute top-4 left-4">
                    <TierBadge level={profile.subscriptionLevel} />
                  </div>
                )}
                {profile.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    <span className="online-dot" />
                    Online now
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {profile.photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {profile.photos.map((photo: ProfilePhoto) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className="shrink-0 rounded-lg overflow-hidden transition-all"
                      style={{
                        width: 80,
                        height: 80,
                        border: `2px solid ${selectedPhoto?.id === photo.id ? 'var(--accent)' : 'var(--border)'}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-3">About me</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">
                {profile.description}
              </p>
            </div>

            {/* Services */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-4">Services offered</h2>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((svc: string) => (
                  <span
                    key={svc}
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      background: 'rgba(233,30,140,0.12)',
                      border: '1px solid rgba(233,30,140,0.3)',
                      color: 'var(--accent)',
                    }}
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Attributes */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-4">Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Age', value: `${profile.age} yrs` },
                  { label: 'Nationality', value: profile.nationality },
                  { label: 'Height', value: `${profile.attributes.height} cm` },
                  { label: 'Weight', value: `${profile.attributes.weight} kg` },
                  { label: 'Hair', value: profile.attributes.hair },
                  { label: 'Eyes', value: profile.attributes.eyes },
                  ...(profile.attributes.measurements
                    ? [{ label: 'Measurements', value: profile.attributes.measurements }]
                    : []),
                  { label: 'Ethnicity', value: profile.attributes.ethnicity },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg p-3"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </p>
                    <p className="font-medium text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div
              className="rounded-xl p-6"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <h2 className="font-bold text-white text-lg mb-3">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang: string) => (
                  <span
                    key={lang}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: '#d1d5db',
                    }}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right column – sticky sidebar */}
          <div className="space-y-4">
            <div
              className="sticky top-4 rounded-2xl p-6 space-y-5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Name & info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-black text-white">
                      {profile.name}
                    </h1>
                    <p className="text-lg font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {profile.age} yrs
                    </p>
                  </div>
                  {profile.subscriptionLevel !== 'free' && (
                    <TierBadge level={profile.subscriptionLevel} />
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.city}
                  {profile.district ? `, ${profile.district}` : ''}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ background: availabilityColor[profile.availability] }}
                  />
                  <span className="text-sm" style={{ color: availabilityColor[profile.availability] }}>
                    {availabilityLabel[profile.availability]}
                  </span>
                  {profile.isVerified && (
                    <>
                      <span style={{ color: 'var(--border)' }}>·</span>
                      <VerifiedBadge />
                    </>
                  )}
                </div>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {profile.views.toLocaleString()} views
              </div>

              {/* Rates */}
              <div>
                <h3 className="font-semibold text-gray-200 mb-3 text-sm">Rates</h3>
                <div className="space-y-2">
                  {profile.rates.map((rate: typeof profile.rates[0]) => (
                    <div
                      key={rate.duration}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--bg-elevated)' }}
                    >
                      <span className="text-gray-400">{rate.label}</span>
                      <span className="font-bold text-white">€{rate.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowContact(true)}
                className="btn-accent w-full justify-center py-3 text-sm font-semibold"
              >
                📞 Contact {profile.name}
              </button>

              <button
                className="btn-ghost w-full justify-center py-2.5 text-sm"
                onClick={() => {
                  navigator.share?.({
                    title: `${profile.name} – Lvvd`,
                    url: window.location.href,
                  });
                }}
              >
                Share profile
              </button>

              {/* Safety notice */}
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                🔒 Your data is safe. We never share your information with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Related profiles */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="section-title mb-6">
              More profiles in <span>{profile.city}</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Contact modal */}
      {showContact && (
        <ContactModal profile={profile} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}
