// src/services/advisor.service.ts
import { createClient } from '@/lib/supabase/server'
import type { Profile, Category, City } from '@/types'

const PUBLIC_COLUMNS = `
  id, slug, name, age, city, district, nationality,
  languages, description, photos, services, attributes,
  rates, availability, is_verified, is_online,
  subscription_level, views, created_at, updated_at
`

const TIER_ORDER: Record<string, number> = { diamond: 0, premium: 1, free: 2 }

function mapRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    age: row.age as number,
    city: row.city as string,
    district: row.district as string | undefined,
    nationality: row.nationality as string,
    languages: row.languages as string[],
    phone: row.phone as string,
    description: row.description as string,
    photos: row.photos as Profile['photos'],
    services: row.services as string[],
    attributes: row.attributes as Profile['attributes'],
    rates: row.rates as Profile['rates'],
    availability: row.availability as Profile['availability'],
    isVerified: row.is_verified as boolean,
    isOnline: row.is_online as boolean,
    subscriptionLevel: row.subscription_level as Profile['subscriptionLevel'],
    views: row.views as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function sortByTier(profiles: Profile[]): Profile[] {
  return profiles.sort(
    (a, b) => (TIER_ORDER[a.subscriptionLevel] ?? 2) - (TIER_ORDER[b.subscriptionLevel] ?? 2)
  )
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .order('views', { ascending: false })

  if (error) { console.error('[getAllProfiles]', error.message); return [] }
  return sortByTier((data as Record<string, unknown>[]).map(mapRow))
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .single()

  if (error) { console.error('[getProfileBySlug]', error.message); return null }
  return mapRow(data as Record<string, unknown>)
}

export async function getFeaturedProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(PUBLIC_COLUMNS)
    .in('subscription_level', ['diamond', 'premium'])
    .order('views', { ascending: false })
    .limit(6)

  if (error) { console.error('[getFeaturedProfiles]', error.message); return [] }
  return sortByTier((data as Record<string, unknown>[]).map(mapRow))
}

export async function searchProfiles(filters: {
  city?: string
  query?: string
  minAge?: number
  maxAge?: number
  minPrice?: number
  maxPrice?: number
  subscriptionLevel?: string
  verified?: boolean
  isOnline?: boolean
  sortBy?: string
}): Promise<Profile[]> {
  const supabase = await createClient()
  let q = supabase.from('profiles').select(PUBLIC_COLUMNS)

  if (filters.city) q = q.eq('city', filters.city)
  if (filters.subscriptionLevel) q = q.eq('subscription_level', filters.subscriptionLevel)
  if (filters.verified) q = q.eq('is_verified', true)
  if (filters.isOnline) q = q.eq('is_online', true)
  if (filters.minAge) q = q.gte('age', filters.minAge)
  if (filters.maxAge) q = q.lte('age', filters.maxAge)
  if (filters.query) {
    q = q.or(`name.ilike.%${filters.query}%,city.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
  }

  const { data, error } = await q
  if (error) { console.error('[searchProfiles]', error.message); return [] }

  let result = (data as Record<string, unknown>[]).map(mapRow)

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

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('*').order('count', { ascending: false })
  if (error) { console.error('[getCategories]', error.message); return [] }
  return data as Category[]
}

export async function getCities(): Promise<City[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cities').select('*').order('count', { ascending: false })
  if (error) { console.error('[getCities]', error.message); return [] }
  return data as City[]
}

export async function incrementViews(slug: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_profile_views', { profile_slug: slug })
}