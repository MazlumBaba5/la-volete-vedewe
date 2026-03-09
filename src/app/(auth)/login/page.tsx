'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Mock auth
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    // Demo: always show error since no real backend
    setError('Demo: backend not connected. Use mock credentials demo@test.it / password');
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-sm rounded-2xl p-8 space-y-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 60px rgba(233,30,140,0.05)',
        }}
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-xs px-4 py-3 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="input-dark"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-400">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="input-dark"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full justify-center py-3 text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            or
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Social login (mock) */}
        <div className="space-y-2">
          {[
            { icon: '🔵', label: 'Continue with Facebook' },
            { icon: '⚪', label: 'Continue with Google' },
          ].map((prov) => (
            <button
              key={prov.label}
              onClick={() => setError('Demo: social login not available in demo mode')}
              className="btn-ghost w-full justify-center text-sm py-2.5 flex items-center gap-2"
            >
              {prov.icon} {prov.label}
            </button>
          ))}
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Don’t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
