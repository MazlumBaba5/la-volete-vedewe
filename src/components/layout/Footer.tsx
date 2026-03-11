import Link from 'next/link';
import { MOCK_CATEGORIES, MOCK_CITIES } from '@/lib/mock-data';

export default function Footer() {
  return (
    <footer
      className="mt-16 border-t text-sm"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="px-4 lg:px-8 py-12" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-xl font-black"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #ff6eb4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Lvvd
            </span>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The most-visited adult personal ads portal in Netherlands.
              <br />
              All content is published by adult users.
            </p>
          </div>

          {/* Categorie */}
          <div>
            <h4 className="font-semibold text-gray-300 mb-3">Categories</h4>
            <ul className="space-y-2">
              {MOCK_CATEGORIES.slice(0, 6).map((cat: typeof MOCK_CATEGORIES[0]) => (
                <li key={cat.id}>
                  <Link
                    href={`/listings?categoria=${cat.slug}`}
                    className="transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Città */}
          <div>
            <h4 className="font-semibold text-gray-300 mb-3">Top Cities</h4>
            <ul className="space-y-2">
              {MOCK_CITIES.slice(0, 8).map((city: typeof MOCK_CITIES[0]) => (
                <li key={city.id}>
                  <Link
                    href={`/listings?city=${encodeURIComponent(city.name)}`}
                    className="transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-semibold text-gray-300 mb-3">Info</h4>
            <ul className="space-y-2">
              {[
                { href: '/how-it-works', label: 'How it works' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/register', label: 'Post an ad' },
                { href: '/safety', label: 'Safety' },
                { href: '/contact', label: 'Contact' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Age disclaimer */}
        <div
          className="mt-10 pt-6 border-t text-xs text-center space-y-1"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <p>
            ⚠️ This site contains adult material. By accessing it you confirm you are at least{' '}
            <strong className="text-gray-400">18 years old</strong>.
          </p>
          <p>
            © {new Date().getFullYear()} Lvvd · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
