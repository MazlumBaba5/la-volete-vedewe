import Link from 'next/link';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

export default function CategorySection() {
  return (
    <section className="px-4 lg:px-8 py-10" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <h2 className="section-title mb-6">
        Sfoglia per <span>categoria</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {MOCK_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            href={`/annunci?categoria=${cat.slug}`}
            className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl text-center transition-all group"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
              {cat.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {cat.count.toLocaleString()}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
