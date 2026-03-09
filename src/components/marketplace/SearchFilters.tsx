'use client';

import { type SearchFilters } from '@/types';
import { MOCK_CITIES, AVAILABLE_SERVICES } from '@/lib/mock-data';

interface Props {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClose?: () => void;
}

export default function SearchFilters({ filters, onChange, onClose }: Props) {
  const update = (partial: Partial<SearchFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200">Filtri</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({})}
            className="text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Azzera tutto
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

      {/* Città */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">Città</label>
        <select
          value={filters.city ?? ''}
          onChange={(e) => update({ city: e.target.value || undefined })}
          className="input-dark"
        >
          <option value="">Tutta Italia</option>
          {MOCK_CITIES.map((c: typeof MOCK_CITIES[0]) => (
            <option key={c.id} value={c.name}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
      </div>

      {/* Età */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">
          Età:{' '}
          <span style={{ color: 'var(--accent)' }}>
            {filters.minAge ?? 18} – {filters.maxAge ?? 60} anni
          </span>
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min={18}
            max={filters.maxAge ?? 60}
            value={filters.minAge ?? 18}
            onChange={(e) => update({ minAge: Number(e.target.value) || undefined })}
            className="input-dark"
            placeholder="Da"
          />
          <input
            type="number"
            min={filters.minAge ?? 18}
            max={99}
            value={filters.maxAge ?? ''}
            onChange={(e) => update({ maxAge: Number(e.target.value) || undefined })}
            className="input-dark"
            placeholder="A"
          />
        </div>
      </div>

      {/* Prezzo */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">
          Prezzo / ora:{' '}
          <span style={{ color: 'var(--accent)' }}>
            €{filters.minPrice ?? 0} – €{filters.maxPrice ?? '∞'}
          </span>
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            min={0}
            value={filters.minPrice ?? ''}
            onChange={(e) => update({ minPrice: Number(e.target.value) || undefined })}
            className="input-dark"
            placeholder="Min €"
          />
          <input
            type="number"
            min={0}
            value={filters.maxPrice ?? ''}
            onChange={(e) => update({ maxPrice: Number(e.target.value) || undefined })}
            className="input-dark"
            placeholder="Max €"
          />
        </div>
      </div>

      {/* Tier */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">Livello</label>
        <div className="space-y-2">
          {[
            { value: undefined, label: 'Tutti' },
            { value: 'diamond', label: '💎 Diamond' },
            { value: 'premium', label: '⭐ Premium' },
            { value: 'free', label: 'Standard' },
          ].map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tier"
                checked={filters.subscriptionLevel === opt.value}
                onChange={() => update({ subscriptionLevel: opt.value as SearchFilters['subscriptionLevel'] })}
                className="accent-pink-500"
              />
              <span className="text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Servizi */}
      <div>
        <label className="block font-medium text-gray-300 mb-2">Servizi</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((svc: string) => {
            const active = filters.services?.includes(svc);
            return (
              <button
                key={svc}
                onClick={() => {
                  const current = filters.services ?? [];
                  const next = active
                    ? current.filter((s: string) => s !== svc)
                    : [...current, svc];
                  update({ services: next.length ? next : undefined });
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
            );
          })}
        </div>
      </div>

      {/* Checkbox options */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.verified}
            onChange={(e) => update({ verified: e.target.checked || undefined })}
            className="accent-pink-500 w-4 h-4"
          />
          <span className="text-gray-300">Solo profili verificati ✓</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!filters.isOnline}
            onChange={(e) => update({ isOnline: e.target.checked || undefined })}
            className="accent-pink-500 w-4 h-4"
          />
          <span className="text-gray-300">
            Solo online{' '}
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1" />
          </span>
        </label>
      </div>
    </div>
  );
}
