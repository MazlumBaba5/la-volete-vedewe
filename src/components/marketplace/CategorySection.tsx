import Link from 'next/link';
import { LISTING_CATEGORY_GROUPS, MASSAGE_GROUP } from '@/lib/listing-navigation';

export default function CategorySection() {
  const categories = [...LISTING_CATEGORY_GROUPS, MASSAGE_GROUP];

  return (
    <section className="px-4 lg:px-8 py-10" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <h2 className="section-title mb-6">
        Browse by <span>category</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={('category' in cat)
              ? `/listings?category=${cat.category}`
              : `/listings?services=${encodeURIComponent('Massage')},${encodeURIComponent('Erotic massage')}`}
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
          </Link>
        ))}
      </div>
    </section>
  );
}
