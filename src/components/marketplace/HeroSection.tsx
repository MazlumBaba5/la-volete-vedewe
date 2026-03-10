'use client'
// src/components/marketplace/HeroSection.tsx

import { useState } from 'react'
import Link from 'next/link'
import type { City } from '@/types'

interface Props {
  cities?: City[]
}

export default function HeroSection({ cities = [] }: Props) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (city) params.set('city', city)
    window.location.href = `/listings?${params.toString()}`
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

      <div className="relative px-4 lg:px-8 py-16 flex flex-col items-center text-center"
        style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(233,30,140,0.15)', border: '1px solid rgba(233,30,140,0.4)', color: 'var(--accent)' }}>
          🇳🇱 &nbsp;+2800 listings across the Netherlands
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-3xl">
          Find the{' '}
          <span style={{ background: 'linear-gradient(135deg, var(--accent), #ff6eb4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            perfect
          </span>{' '}
          companion for you
        </h1>

        <p className="mt-4 text-gray-400 text-lg max-w-xl">
          Thousands of verified profiles across the Netherlands. Discretion and safety guaranteed.
        </p>

        {/* Search box */}
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

        {/* Stats */}
        <div className="mt-10 flex gap-8 md:gap-16">
          {[
            { value: '2.800+', label: 'Active listings' },
            { value: '98%', label: 'Fast response' },
            { value: '12+', label: 'Cities' },
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

      </div>
    </section>
  )
}