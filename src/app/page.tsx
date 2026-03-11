// src/app/page.tsx
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/marketplace/HeroSection'
import CategorySection from '@/components/marketplace/CategorySection'
import ProfileCard from '@/components/marketplace/ProfileCard'
import { getFeaturedProfiles, getRecentProfiles, getCities, getSiteStats } from '@/services/advisor.service'

export const revalidate = 60

export default async function Home() {
  const [featured, recent, cities, stats] = await Promise.all([
    getFeaturedProfiles(),
    getRecentProfiles(),
    getCities(),
    getSiteStats(),
  ])

  return (
    <>
      <Header />
      <main>
        <HeroSection cities={cities} stats={stats} />
        <CategorySection />

        {/* Featured */}
        <section className="px-4 lg:px-8 py-10" style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Featured <span>profiles</span></h2>
            <Link href="/listings?tier=diamond" className="text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {featured.map((p) => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </section>

        <div className="px-4 lg:px-8" style={{ maxWidth: 1400, margin: '0 auto' }}>
          <hr style={{ borderColor: 'var(--border)' }} />
        </div>

        {/* Recent */}
        <section className="px-4 lg:px-8 py-10" style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">New <span>listings</span></h2>
            <Link href="/listings" className="text-sm font-medium transition-colors" style={{ color: 'var(--accent)' }}>
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recent.map((p) => <ProfileCard key={p.id} profile={p} />)}
          </div>
        </section>

        {/* Cities */}
        <section className="px-4 lg:px-8 py-10 mt-4"
          style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <h2 className="section-title mb-6">Listings by <span>city</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cities.map((city) => (
                <Link key={city.id} href={`/listings?city=${encodeURIComponent(city.name)}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all group"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{city.name}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(233,30,140,0.15)', color: 'var(--accent)' }}>
                    {city.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 lg:px-8 py-12" style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.12) 0%, rgba(124,58,237,0.12) 100%)', border: '1px solid rgba(233,30,140,0.25)' }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Are you an escort?</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">
              Post your listing for free and reach thousands of clients every day. Upgrade to Diamond or Premium for maximum visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="btn-accent px-8 py-3">Post for free</Link>
              <Link href="/pricing" className="btn-outline px-8 py-3">See pricing</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}