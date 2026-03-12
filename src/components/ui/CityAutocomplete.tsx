'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GeoCity {
  city: string
  region: string
}

interface Props {
  city: string
  region: string
  onChange: (city: string, region: string) => void
  required?: boolean
  className?: string
}

export default function CityAutocomplete({
  city,
  onChange,
  required,
  className = 'input-dark',
}: Props) {
  const [query, setQuery] = useState(city)
  const [suggestions, setSuggestions] = useState<GeoCity[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync when controlled value changes externally
  useEffect(() => {
    setQuery(city)
  }, [city])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/geo/cities?q=${encodeURIComponent(q)}`)
      const data: GeoCity[] = await res.json()
      setSuggestions(data)
      setOpen(data.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    // Reset region until the user selects a valid Dutch city.
    onChange(val, '')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400)
  }

  const handleSelect = (s: GeoCity) => {
    setQuery(s.city)
    onChange(s.city, s.region)
    setSuggestions([])
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="e.g. Amsterdam, Rotterdam..."
        className={className}
        autoComplete="off"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-4 h-4 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors"
              >
                <span className="text-white text-sm font-medium">{s.city}</span>
                {s.region && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                    {s.region}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
