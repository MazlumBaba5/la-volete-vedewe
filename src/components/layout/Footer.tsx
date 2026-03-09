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
              EscortItalia
            </span>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Il portale di annunci personali per adulti più visitato in Italia.
              <br />
              Tutti i contenuti sono pubblicati da utenti maggiorenni.
            </p>
          </div>

          {/* Categorie */}
          <div>
            <h4 className="font-semibold text-gray-300 mb-3">Categorie</h4>
            <ul className="space-y-2">
              {MOCK_CATEGORIES.slice(0, 6).map((cat: typeof MOCK_CATEGORIES[0]) => (
                <li key={cat.id}>
                  <Link
                    href={`/annunci?categoria=${cat.slug}`}
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
            <h4 className="font-semibold text-gray-300 mb-3">Città principali</h4>
            <ul className="space-y-2">
              {MOCK_CITIES.slice(0, 8).map((city: typeof MOCK_CITIES[0]) => (
                <li key={city.id}>
                  <Link
                    href={`/annunci?citta=${encodeURIComponent(city.name)}`}
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
                { href: '/come-funziona', label: 'Come funziona' },
                { href: '/tariffe', label: 'Tariffe' },
                { href: '/registrati', label: 'Pubblica annuncio' },
                { href: '/sicurezza', label: 'Sicurezza' },
                { href: '/contatti', label: 'Contatti' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/termini', label: 'Termini di servizio' },
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
            ⚠️ Questo sito contiene materiale per adulti. Accedendo dichiari di avere almeno{' '}
            <strong className="text-gray-400">18 anni</strong>.
          </p>
          <p>
            © {new Date().getFullYear()} EscortItalia · Tutti i diritti riservati · P.IVA 00000000000
          </p>
        </div>
      </div>
    </footer>
  );
}
