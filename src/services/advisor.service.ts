// src/services/advisor.service.ts
import { createAdminClient } from '@/lib/supabase/server'
import type { Profile, ProfilePhoto, Category, City } from '@/types'

// Selects advisor columns + their media via the FK relationship.
// PostgREST resolves advisor_media automatically via the FK on advisor_id.
const PUBLIC_COLUMNS = `
  id,
  profile_id,
  slug,
  name,
  age,
  city,
  region,
  country,
  languages,
  bio,
  services_tags,
  availability,
  is_verified,
  is_featured,
  views_count,
  created_at,
  updated_at,
  advisor_media (
    id,
    url,
    is_cover,
    sort_order
  )
`

const TIER_ORDER: Record<string, number> = { diamond: 0, premium: 1, free: 2 }

interface MediaRow {
  id: string
  url: string
  is_cover: boolean
  sort_order: number
}

function mapRow(row: Record<string, unknown>, subscriptionTier?: string): Profile {
  const mediaRows = ((row.advisor_media as MediaRow[]) ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))

  const photos: ProfilePhoto[] = mediaRows.map((m, idx) => ({
    id: m.id,
    url: m.url,
    isMain: m.is_cover || idx === 0,
  }))

  return {
    id: row.profile_id as string,
    slug: row.slug as string,
    name: row.name as string,
    age: (row.age as number) || 18,
    city: row.city as string,
    district: row.region as string | undefined,
    nationality: (row.country as string) || 'NL',
    languages: (row.languages as string[]) || [],
    phone: '',
    description: (row.bio as string) || '',
    photos,
    services: (row.services_tags as string[]) || [],
    attributes: {
      height: 0,
      weight: 0,
      hair: '',
      eyes: '',
      ethnicity: '',
    },
    rates: [],
    availability: (row.availability as Profile['availability']) || 'available',
    isVerified: (row.is_verified as boolean) || false,
    isOnline: false,
    subscriptionLevel: (subscriptionTier as Profile['subscriptionLevel']) || 'free',
    views: (row.views_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function sortByTier(profiles: Profile[]): Profile[] {
  return profiles.sort(
    (a, b) => (TIER_ORDER[a.subscriptionLevel] ?? 2) - (TIER_ORDER[b.subscriptionLevel] ?? 2)
  )
}

/** Fetch active subscription tiers for a set of advisor rows and enrich them. */
async function enrichWithSubscriptions(
  supabase: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[]
): Promise<Profile[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id as string)
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('advisor_id, tier')
    .in('advisor_id', ids)
    .eq('status', 'active')
    .in('tier', ['premium', 'diamond'])
  const tierMap = new Map<string, string>(
    (subs ?? []).map((s: { advisor_id: string; tier: string }) => [s.advisor_id, s.tier])
  )
  return rows.map((r) => mapRow(r, tierMap.get(r.id as string)))
}

// Statuses that should be visible in the public marketplace.
// 'pending' is included because advisors register as 'active' via the API;
// any manually-inserted row defaults to 'pending' and should still appear.
const VISIBLE_STATUSES = ['active', 'pending'] as const

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('advisors')
    .select(PUBLIC_COLUMNS)
    .in('status', VISIBLE_STATUSES)
    .order('views_count', { ascending: false })

  if (error) { console.error('[getAllProfiles]', error.message); return [] }
  const profiles = await enrichWithSubscriptions(supabase, data as unknown as Record<string, unknown>[])
  return sortByTier(profiles)
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('advisors')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .single()

  if (error) { console.error('[getProfileBySlug]', error.message); return null }
  const row = data as unknown as Record<string, unknown>
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('advisor_id', row.id as string)
    .eq('status', 'active')
    .in('tier', ['premium', 'diamond'])
    .maybeSingle()
  return mapRow(row, subs?.tier)
}

export async function getFeaturedProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()

  // Advisors with an active paid subscription — these are "featured"
  const { data: paidSubs } = await supabase
    .from('subscriptions')
    .select('advisor_id, tier')
    .eq('status', 'active')
    .in('tier', ['premium', 'diamond'])

  if (paidSubs && paidSubs.length > 0) {
    const paidIds = paidSubs.map((s: { advisor_id: string }) => s.advisor_id)
    const tierMap = new Map<string, string>(
      paidSubs.map((s: { advisor_id: string; tier: string }) => [s.advisor_id, s.tier])
    )
    const { data, error } = await supabase
      .from('advisors')
      .select(PUBLIC_COLUMNS)
      .in('id', paidIds)
      .in('status', VISIBLE_STATUSES)
      .order('views_count', { ascending: false })
      .limit(12)
    if (error) { console.error('[getFeaturedProfiles]', error.message); return [] }
    const profiles = (data as unknown as Record<string, unknown>[]).map((r) =>
      mapRow(r, tierMap.get(r.id as string))
    )
    return sortByTier(profiles)
  }

  // Fallback: most-viewed visible advisors when no paid subscriptions exist yet
  const { data, error } = await supabase
    .from('advisors')
    .select(PUBLIC_COLUMNS)
    .in('status', VISIBLE_STATUSES)
    .order('views_count', { ascending: false })
    .limit(12)

  if (error) { console.error('[getFeaturedProfiles]', error.message); return [] }
  return (data as unknown as Record<string, unknown>[]).map((r) => mapRow(r))
}

export async function getRecentProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('advisors')
    .select(PUBLIC_COLUMNS)
    .in('status', VISIBLE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) { console.error('[getRecentProfiles]', error.message); return [] }
  return enrichWithSubscriptions(supabase, data as unknown as Record<string, unknown>[])
}

export async function searchProfiles(filters: {
  city?: string
  query?: string
  minAge?: number
  maxAge?: number
  verified?: boolean
  sortBy?: string
}): Promise<Profile[]> {
  const supabase = createAdminClient()
  let q = supabase
    .from('advisors')
    .select(PUBLIC_COLUMNS)
    .in('status', VISIBLE_STATUSES)

  if (filters.city) q = q.eq('city', filters.city)
  if (filters.verified) q = q.eq('is_verified', true)
  if (filters.minAge) q = q.gte('age', filters.minAge)
  if (filters.maxAge) q = q.lte('age', filters.maxAge)
  if (filters.query) {
    q = q.or(
      `name.ilike.%${filters.query}%,city.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`
    )
  }

  const { data, error } = await q
  if (error) { console.error('[searchProfiles]', error.message); return [] }

  const result = await enrichWithSubscriptions(supabase, data as unknown as Record<string, unknown>[])

  result.sort((a, b) => {
    const tierDiff = (TIER_ORDER[a.subscriptionLevel] ?? 2) - (TIER_ORDER[b.subscriptionLevel] ?? 2)
    if (tierDiff !== 0) return tierDiff
    return b.views - a.views
  })

  return result
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('count', { ascending: false })
  if (error) { console.error('[getCategories]', error.message); return [] }
  return data as Category[]
}

/**
 * Compute city counts directly from the advisors table so the data is always
 * fresh and never depends on a separately-maintained cities table.
 */
export async function getCities(): Promise<City[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('advisors')
    .select('city, region')
    .in('status', VISIBLE_STATUSES)
    .not('city', 'is', null)

  if (error) { console.error('[getCities]', error.message); return [] }

  const cityMap = new Map<string, { count: number; region: string }>()
  for (const row of data as { city: string; region: string | null }[]) {
    const city = row.city?.trim()
    if (!city) continue
    const existing = cityMap.get(city)
    if (existing) {
      existing.count++
    } else {
      cityMap.set(city, { count: 1, region: row.region ?? '' })
    }
  }

  return Array.from(cityMap.entries())
    .map(([name, { count, region }]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count,
      region,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function incrementViews(slug: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.rpc('increment_advisor_views', { advisor_slug: slug }).throwOnError()
}

export interface SiteStats {
  totalAdvisors: number
  totalCities: number
}

export async function getSiteStats(): Promise<SiteStats> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('advisors')
    .select('*', { count: 'exact', head: true })
    .in('status', VISIBLE_STATUSES)

  const { data: cityData } = await supabase
    .from('advisors')
    .select('city')
    .in('status', VISIBLE_STATUSES)
    .not('city', 'is', null)

  const cityCount = new Set((cityData ?? []).map((r: { city: string }) => r.city?.trim()).filter(Boolean)).size

  return {
    totalAdvisors: count ?? 0,
    totalCities: cityCount,
  }
}
