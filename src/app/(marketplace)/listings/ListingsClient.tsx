'use client'
// src/app/(marketplace)/listings/ListingsClient.tsx

import { useState, useMemo } from 'react'
import type { Profile, SearchFilters, City } from '@/types'
import ProfileCard from '@/components/marketplace/ProfileCard'
import SearchFiltersPanel from '@/components/marketplace/SearchFilters'

const TIER_ORDER: Record<string, number> = { diamond: 0, premium: 1, free: 2 }
const ITEMS_PER_PAGE = 12

function filterProfiles(profiles: Profile[], filters: SearchFilters): Profile[] {
    let result = [...profiles]

    if (filters.query) {
        const q = filters.query.toLowerCase()
        result = result.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.city.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.services.some((s) => s.toLowerCase().includes(q))
        )
    }
    if (filters.city) result = result.filter((p) => p.city === filters.city)
    if (filters.minAge) result = result.filter((p) => p.age >= filters.minAge!)
    if (filters.maxAge) result = result.filter((p) => p.age <= filters.maxAge!)
    if (filters.subscriptionLevel) result = result.filter((p) => p.subscriptionLevel === filters.subscriptionLevel)
    if (filters.verified) result = result.filter((p) => p.isVerified)
    if (filters.isOnline) result = result.filter((p) => p.isOnline)
    if (filters.minPrice) result = result.filter((p) => p.rates.some((r) => r.price >= filters.minPrice!))
    if (filters.maxPrice) result = result.filter((p) => p.rates.some((r) => r.price <= filters.maxPrice!))

    result.sort((a, b) => {
        const tierDiff = (TIER_ORDER[a.subscriptionLevel] ?? 2) - (TIER_ORDER[b.subscriptionLevel] ?? 2)
        if (tierDiff !== 0) return tierDiff
        switch (filters.sortBy) {
            case 'popular': return b.views - a.views
            case 'price_asc': return (a.rates[0]?.price ?? 0) - (b.rates[0]?.price ?? 0)
            case 'price_desc': return (b.rates[0]?.price ?? 0) - (a.rates[0]?.price ?? 0)
            default: return b.views - a.views
        }
    })

    return result
}

interface Props {
    initialProfiles: Profile[]
    cities: City[]
}

export default function ListingsClient({ initialProfiles, cities }: Props) {
    const [filters, setFilters] = useState<SearchFilters>({})
    const [page, setPage] = useState(1)
    const [filtersOpen, setFiltersOpen] = useState(false)

    const results = useMemo(() => filterProfiles(initialProfiles, filters), [initialProfiles, filters])
    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
    const paginated = results.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    const handleFilterChange = (newFilters: SearchFilters) => {
        setFilters(newFilters)
        setPage(1)
    }

    const activeFilterCount = Object.values(filters).filter(
        (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
    ).length

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
            <div className="px-4 lg:px-8 py-6" style={{ maxWidth: 1400, margin: '0 auto' }}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Listings{filters.city && <span style={{ color: 'var(--accent)' }}> in {filters.city}</span>}
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{results.length} profiles found</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={filters.sortBy ?? 'popular'}
                            onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value as SearchFilters['sortBy'] })}
                            className="input-dark text-sm !py-2 w-44"
                        >
                            <option value="popular">Most viewed</option>
                            <option value="price_asc">Price ↑</option>
                            <option value="price_desc">Price ↓</option>
                        </select>
                        <button onClick={() => setFiltersOpen(true)} className="lg:hidden btn-ghost text-sm px-4 py-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent)' }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex gap-6">
                    {/* Sidebar desktop */}
                    <aside className="hidden lg:block w-64 shrink-0 sticky top-4 self-start rounded-xl p-5"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
                        <SearchFiltersPanel filters={filters} onChange={handleFilterChange} cities={cities} />
                    </aside>

                    {/* Grid */}
                    <div className="flex-1 min-w-0">
                        {paginated.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {paginated.map((p) => <ProfileCard key={p.id} profile={p} />)}
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost px-3 py-2 text-sm disabled:opacity-40">←</button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                            <button key={n} onClick={() => setPage(n)} className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                                                style={{ background: n === page ? 'var(--accent)' : 'var(--bg-elevated)', border: `1px solid ${n === page ? 'var(--accent)' : 'var(--border)'}`, color: n === page ? '#fff' : '#9ca3af' }}>
                                                {n}
                                            </button>
                                        ))}
                                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost px-3 py-2 text-sm disabled:opacity-40">→</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="text-5xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-white mb-2">No results</h3>
                                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Try adjusting your search filters</p>
                                <button onClick={() => handleFilterChange({})} className="btn-outline px-6 py-2">Reset filters</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {filtersOpen && (
                <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setFiltersOpen(false)}>
                    <div className="ml-auto w-80 max-w-full h-full overflow-y-auto p-6" style={{ background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
                        <SearchFiltersPanel filters={filters} onChange={handleFilterChange} onClose={() => setFiltersOpen(false)} cities={cities} />
                        <div className="mt-6">
                            <button onClick={() => setFiltersOpen(false)} className="btn-accent w-full justify-center py-3">
                                Apply filters ({results.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}