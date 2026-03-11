'use client'
// src/components/marketplace/SearchFilters.tsx

import { useMemo } from 'react'
import { type SearchFilters, type City } from '@/types'

const AVAILABLE_SERVICES = [
  'GFE', 'Escort', 'Dinner', 'Travel', 'Incall',
  'Outcall', 'Massage', 'Erotic massage', 'Domination',
  'Virtual', 'Webcam', 'Couples',
]

interface Props {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  onClose?: () => void
  cities?: City[]
}

export default function SearchFilters({ filters, onChange, onClose, cities = [] }: Props) {
  const update = (partial: Partial<SearchFilters>) => onChange({ ...filters, ...partial })

  // Derive sorted unique regions from the cities list
  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const c of cities) {
      if (c.region) set.add(c.region)
    }
    return Array.from(set).sort()
  }, [cities])

  // Filter city dropdown to only show cities in the selected region
  const visibleCities = useMemo(() => {
    if (!filters.region) return cities
    return cities.filter((c) => c.region === filters.region)
  }, [cities, filters.region])

  return (
    <div className="space-y-6 text-sm">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200">Filters</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => onChange({})} className="text-xs" style={{ color: 'var(--accent)' }}>
            Reset all
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Region */}
      {regions.length > 0 && (
        <div>
          <label className="block font-medium text-gray-300 mb-2">Region</label>
          <select
            value={filters.region ?? ''}
            onChange={(e) => update({ region: e.target.value || undefined, city: undefined })}
            className="input-dark"
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {/* City */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">City</label>
        <select
          value={filters.city ?? ''}
          onChange={(e) => update({ city: e.target.value || undefined })}
          className="input-dark"
        >
          <option value="">All Cities</option>
          {visibleCities.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Age */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">
          Age:{' '}
          <span style={{ color: 'var(--accent)' }}>
            {filters.minAge ?? 18} – {filters.maxAge ?? 60} yrs
          </span>
        </label>
        <div className="flex gap-3">
          <input type="number" min={18} max={filters.maxAge ?? 60} value={filters.minAge ?? 18}
            onChange={(e) => update({ minAge: Number(e.target.value) || undefined })}
            className="input-dark" placeholder="From" />
          <input type="number" min={filters.minAge ?? 18} max={99} value={filters.maxAge ?? ''}
            onChange={(e) => update({ maxAge: Number(e.target.value) || undefined })}
            className="input-dark" placeholder="To" />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">
          Price / hour:{' '}
          <span style={{ color: 'var(--accent)' }}>
            €{filters.minPrice ?? 0} – €{filters.maxPrice ?? '∞'}
          </span>
        </label>
        <div className="flex gap-3">
          <input type="number" min={0} value={filters.minPrice ?? ''}
            onChange={(e) => update({ minPrice: Number(e.target.value) || undefined })}
            className="input-dark" placeholder="Min €" />
          <input type="number" min={0} value={filters.maxPrice ?? ''}
            onChange={(e) => update({ maxPrice: Number(e.target.value) || undefined })}
            className="input-dark" placeholder="Max €" />
        </div>
      </div>

      {/* Tier */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">Tier</label>
        <div className="space-y-2">
          {[
            { value: undefined, label: 'All' },
            { value: 'diamond', label: '💎 Diamond' },
            { value: 'premium', label: '⭐ Premium' },
            { value: 'free', label: 'Standard' },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tier"
                checked={filters.subscriptionLevel === opt.value}
                onChange={() => update({ subscriptionLevel: opt.value as SearchFilters['subscriptionLevel'] })}
                className="accent-pink-500" />
              <span className="text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">Services</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((svc) => {
            const active = filters.services?.includes(svc)
            return (
              <button key={svc}
                onClick={() => {
                  const current = filters.services ?? []
                  const next = active ? current.filter((s) => s !== svc) : [...current, svc]
                  update({ services: next.length ? next : undefined })
                }}
                className="text-xs px-2.5 py-1 rounded-full border transition-all"
                style={{
                  background: active ? 'rgba(233,30,140,0.15)' : 'var(--bg-elevated)',
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  color: active ? 'var(--accent)' : '#9ca3af',
                }}
              >
                {svc}
              </button>
            )
          })}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!filters.verified}
            onChange={(e) => update({ verified: e.target.checked || undefined })}
            className="accent-pink-500 w-4 h-4" />
          <span className="text-gray-300">Verified profiles only ✓</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!filters.isOnline}
            onChange={(e) => update({ isOnline: e.target.checked || undefined })}
            className="accent-pink-500 w-4 h-4" />
          <span className="text-gray-300">
            Online only{' '}
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          </span>
        </label>
      </div>

    </div>
  )
}