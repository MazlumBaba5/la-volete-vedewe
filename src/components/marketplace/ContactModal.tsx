'use client';

import { useState } from 'react';
import { type Profile } from '@/types';

interface Props {
  profile: Profile;
  onClose: () => void;
}

export default function ContactModal({ profile, onClose }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    // Mock: simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setUnlocked(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile summary */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full overflow-hidden shrink-0"
            style={{ border: '2px solid var(--accent)' }}
          >
            {profile.photos[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photos[0].url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white">
              {profile.name}, {profile.age}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {profile.city}
            </p>
          </div>
        </div>

        {unlocked ? (
          /* Unlocked state */
          <div className="space-y-3">
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)' }}
              >
                📞
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Phone number</p>
                <p className="font-bold text-white text-lg">{profile.phone}</p>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Always respect privacy and personal boundaries.
            </p>
          </div>
        ) : (
          /* Locked state */
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: 'rgba(233,30,140,0.2)' }}
              >
                🔒
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Phone number</p>
                <p className="font-bold text-white text-lg tracking-widest select-none">
                  +39 3●● ●●● ●●●●
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 text-center">
              Sign in or sign up to view the contact for{' '}
              <strong className="text-white">{profile.name}</strong>
            </p>

            <button
              onClick={handleUnlock}
              disabled={loading}
              className="btn-accent w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading…
                </>
              ) : (
                '\uD83D\uDD13 Show contact (demo)'
              )}
            </button>

            <div className="flex gap-2">
              <a
                href="/login"
                className="btn-outline flex-1 text-center text-sm py-2"
              >
                Sign in
              </a>
              <a
                href="/register"
                className="btn-ghost flex-1 text-center text-sm py-2"
              >
                Sign up
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
