'use client'
// src/components/marketplace/HeroSection.tsx

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { City, Profile } from '@/types'

interface Props {
  cities?: City[]
  featuredProfiles?: Profile[]
}

function FeaturedPill({ level }: { level: Profile['subscriptionLevel'] }) {
  if (level === 'diamond') {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: 'rgba(56,189,248,0.18)', color: '#67e8f9', border: '1px solid rgba(56,189,248,0.3)' }}>
        Diamond
      </span>
    )
  }

  if (level === 'premium') {
    return (
      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: 'rgba(245,158,11,0.18)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.28)' }}>
        Premium
      </span>
    )
  }

  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: 'rgba(255,255,255,0.08)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.2)' }}>
      Standard
    </span>
  )
}

export default function HeroSection({ cities = [], featuredProfiles = [] }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const heroFeatured = featuredProfiles.slice(0, 8)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (city) params.set('city', city)
    router.push(`/listings?${params.toString()}`)
  }

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0014 0%, #1a0030 40%, #12001c 70%, #09090f 100%)',
        minHeight: 420,
      }}
    >
      {/* BG decoration */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(233,30,140,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--accent)' }} />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: '#7c3aed' }} />

      <div className="relative px-4 lg:px-8 py-14" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="flex flex-col items-center text-center">

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight max-w-3xl" style={{ color: '#ff00ff', filter: 'drop-shadow(0 0 12px rgba(255, 0, 255, 0.8))' }}>L❤❤D</h1>
            <h2 className="text-3xl md:text-xl lg:text-5xl font-black text-white leading-tight max-w-3xl">
              Pleasure begins with the perfect company.
            </h2>

            <p className="mt-4 text-gray-400 text-lg max-w-xl">
              Lot of verified profiles across the Netherlands 🇳🇱. Discretion and safety guaranteed.
            </p>

            {/* Search box (unchanged style) */}
            <div className="mt-8 w-full max-w-2xl flex flex-col sm:flex-row gap-3 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Name, service, nationality…"
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-transparent border-0 border-l text-sm text-gray-300 px-3 py-2 outline-none cursor-pointer sm:w-44"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <option value="" style={{ background: '#13131f' }}>All Cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.name} style={{ background: '#13131f' }}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button onClick={handleSearch} className="btn-accent px-5 py-2 text-sm shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>

            {heroFeatured.length > 0 && (
              <div
                className="mt-4 w-full max-w-6xl rounded-2xl p-3 sm:p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <div className="mb-2 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: '#f9a8d4' }}>
                    Featured profiles
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <div className="inline-flex min-w-full gap-2">
                    {heroFeatured.map((profile) => (
                      <Link
                        key={`hero-featured-${profile.id}`}
                        href={`/profile/${profile.slug}`}
                        className="group w-[185px] shrink-0 rounded-2xl p-2 transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <div className="relative h-24 overflow-hidden rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          {profile.photos[0]?.url ? (
                            <Image
                              src={profile.photos[0].url}
                              alt={profile.name}
                              fill
                              sizes="185px"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-300">
                              {profile.name}
                            </div>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-left">
                          <p className="truncate text-xs font-semibold text-white">{profile.name}</p>
                          <div className="flex items-center justify-between gap-2">
                            <FeaturedPill level={profile.subscriptionLevel} />
                            <span className="text-[11px]" style={{ color: '#cbd5e1' }}>{profile.city}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick cities */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {cities.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`/listings?city=${encodeURIComponent(c.name)}`}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db' }}
                >
                  {c.name}{' '}
                  <span style={{ color: 'var(--text-muted)' }}>({c.count})</span>
                </Link>
              ))}
            </div>

            {/*
              Re-enable when marketplace volume is high enough to display trust metrics:
              - 5+ Active listings
              - 98% Fast response
              - 3+ Cities
            */}
            {/*
            <div className="mt-10 flex gap-8 md:gap-16">
              {[
                { value: stats ? `${stats.totalAdvisors.toLocaleString()}+` : '…', label: 'Active listings' },
                { value: '98%', label: 'Fast response' },
                { value: stats ? `${stats.totalCities}+` : '…', label: 'Cities' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #ff6eb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
            */}
        </div>
      </div>
    </section>
  )
}
