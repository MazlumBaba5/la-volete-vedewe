import Link from 'next/link';
import { type Profile } from '@/types';
import { TierBadge, VerifiedBadge } from '@/components/ui/Badge';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const mainPhoto = profile.photos.find((p: typeof profile.photos[0]) => p.isMain) ?? profile.photos[0];
  const minRate = profile.rates.length > 0 ? Math.min(...profile.rates.map((r: typeof profile.rates[0]) => r.price)) : null;

  return (
    <Link
      href={`/profilo/${profile.slug}`}
      className="profile-card group relative block rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ paddingBottom: '130%' }}>
        {mainPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainPhoto.url}
            alt={profile.name}
            className="profile-card-img absolute inset-0 w-full h-full object-cover transition-transform duration-500"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            style={{ background: 'var(--bg-elevated)' }}
          >
            👤
          </div>
        )}

        {/* Gradient overlay */}
        <div className="photo-overlay absolute inset-0" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {profile.subscriptionLevel !== 'free' && (
            <TierBadge level={profile.subscriptionLevel} />
          )}
          {profile.isVerified && <VerifiedBadge />}
        </div>

        {/* Online dot */}
        {profile.isOnline && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="online-dot" />
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          </div>
        )}

        {/* Photo count */}
        {profile.photos.length > 1 && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white rounded-full px-2 py-0.5"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {profile.photos.length}
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">
                {profile.name}, {profile.age}
              </h3>
              <p className="text-gray-300 text-xs flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {profile.city}
                {profile.district ? `, ${profile.district}` : ''}
              </p>
            </div>
            {minRate && (
              <div className="text-right">
                <p className="text-xs text-gray-400">da</p>
                <p className="text-white font-bold text-sm">€{minRate}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-3 py-3">
        {/* Services */}
        <div className="flex flex-wrap gap-1 min-h-[28px]">
          {profile.services.slice(0, 3).map((s: string) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: '#9ca3af',
              }}
            >
              {s}
            </span>
          ))}
          {profile.services.length > 3 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              +{profile.services.length - 3}
            </span>
          )}
        </div>

        {/* CTA */}
        <div
          className="mt-3 w-full btn-accent text-xs py-2 text-center"
          style={{ fontSize: '0.8rem' }}
        >
          Vedi profilo →
        </div>
      </div>
    </Link>
  );
}
