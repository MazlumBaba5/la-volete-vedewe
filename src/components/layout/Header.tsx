'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 lg:px-8 h-14 gap-4"
        style={{ maxWidth: 1400, margin: '0 auto' }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="text-xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #ff6eb4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            EscortItalia
          </span>
        </Link>

        {/* Search bar – desktop */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim())
              window.location.href = `/annunci?q=${encodeURIComponent(searchQuery)}`;
          }}
          className="hidden md:flex flex-1 max-w-lg items-center gap-2"
        >
          <div
            className="flex items-center flex-1 rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <svg
              className="w-4 h-4 ml-3 shrink-0"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, name or service…"
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign in
          </Link>
          <Link href="/registrati" className="btn-accent text-sm px-4 py-2">
            Post an ad
          </Link>
          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav
        className="hidden md:block border-t overflow-x-auto"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center px-4 lg:px-8 gap-1 py-1"
          style={{ maxWidth: 1400, margin: '0 auto' }}
        >
          <Link
            href="/annunci"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white whitespace-nowrap rounded-lg transition-colors"
            style={{ ':hover': { background: 'var(--bg-elevated)' } } as React.CSSProperties}
          >
            All listings
          </Link>
          {MOCK_CATEGORIES.map((cat: typeof MOCK_CATEGORIES[0]) => (
            <Link
              key={cat.id}
              href={`/annunci?categoria=${cat.slug}`}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white whitespace-nowrap rounded-lg transition-colors"
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 space-y-3"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}
        >
          {/* Mobile search */}
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <svg
              className="w-4 h-4 ml-3"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              placeholder="Search…"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MOCK_CATEGORIES.map((cat: typeof MOCK_CATEGORIES[0]) => (
              <Link
                key={cat.id}
                href={`/annunci?categoria=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 rounded-lg"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Link href="/login" className="btn-ghost text-sm px-4 py-2 flex-1 text-center">
              Sign in
            </Link>
            <Link href="/registrati" className="btn-accent text-sm px-4 py-2 flex-1 text-center">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
