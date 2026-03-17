// src/app/page.tsx
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/marketplace/HeroSection'
import CategorySection from '@/components/marketplace/CategorySection'
import ProfileCard from '@/components/marketplace/ProfileCard'
import { getFeaturedProfiles, getRecentProfiles, getCities } from '@/services/advisor.service'

export const revalidate = 60

export default async function Home() {
  const [featured, recent, cities] = await Promise.all([
    getFeaturedProfiles(),
    getRecentProfiles(),
    getCities(),
  ])

  return (
    <>
      <Header />
      <main>
        <HeroSection cities={cities} featuredProfiles={featured} />
        <CategorySection />

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

      </main>
      <Footer />
    </>
  )
}
