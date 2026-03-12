// src/services/advisor.service.ts
import { createAdminClient } from '@/lib/supabase/server'
import { toPublicRates } from '@/lib/advisor-profile-options'
import { isSubscriptionCurrentlyActive } from '@/lib/subscriptions'
import { findDutchCity } from '@/lib/netherlands-cities'
import type { Profile, ProfilePhoto, Category, City } from '@/types'

// Selects advisor columns + their media via the FK relationship.
// PostgREST resolves advisor_media automatically via the FK on advisor_id.
const PUBLIC_COLUMNS_BASE = `
  id,
  profile_id,
  slug,
  name,
  advisor_category,
  age,
  city,
  region,
  country,
  languages,
  bio,
  height_cm,
  weight_kg,
  eye_color,
  hair_color,
  ethnicity,
  services_tags,
  incall_rates,
  outcall_rates,
  availability,
  whatsapp_available,
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

const PUBLIC_COLUMNS = `
  reviews_enabled,
  ${PUBLIC_COLUMNS_BASE}
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
    advisorId: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    advisorCategory: row.advisor_category as Profile['advisorCategory'],
    age: (row.age as number) || 18,
    city: row.city as string,
    district: row.region as string | undefined,
    nationality: (row.country as string) || 'NL',
    languages: (row.languages as string[]) || [],
    phone: '',
    whatsappAvailable: (row.whatsapp_available as boolean) ?? false,
    description: (row.bio as string) || '',
    photos,
    services: (row.services_tags as string[]) || [],
    attributes: {
      height: (row.height_cm as number) || 0,
      weight: (row.weight_kg as number) || 0,
      hair: (row.hair_color as string) || '',
      eyes: (row.eye_color as string) || '',
      ethnicity: (row.ethnicity as string) || '',
    },
    rates: toPublicRates(row.incall_rates, row.outcall_rates),
    availability: (row.availability as Profile['availability']) || 'available',
    isVerified: (row.is_verified as boolean) || false,
    isOnline: false,
    subscriptionLevel: (subscriptionTier as Profile['subscriptionLevel']) || 'free',
    reviewsEnabled: (row.reviews_enabled as boolean) ?? true,
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

function isMissingReviewsEnabled(error: { message?: string } | null) {
  return error?.message?.includes('column advisors.reviews_enabled does not exist') ?? false
}

async function selectAdvisorRows(
  runQuery: (columns: string) => Promise<{ data: unknown; error: { message?: string } | null }>
): Promise<Record<string, unknown>[]> {
  const primary = await runQuery(PUBLIC_COLUMNS)
  if (!primary.error) {
    return (primary.data as Record<string, unknown>[]) ?? []
  }

  if (!isMissingReviewsEnabled(primary.error)) {
    throw primary.error
  }

  const fallback = await runQuery(PUBLIC_COLUMNS_BASE)
  if (fallback.error) {
    throw fallback.error
  }

  return ((fallback.data as Record<string, unknown>[]) ?? []).map((row) => ({
    reviews_enabled: true,
    ...row,
  }))
}

/** Fetch active subscription tiers for a set of advisor rows and enrich them. */
async function enrichWithSubscriptions(
  supabase: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[]
): Promise<Profile[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id as string)
  const nowIso = new Date().toISOString()
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('advisor_id, tier, status, current_period_end')
    .in('advisor_id', ids)
    .eq('status', 'active')
    .gt('current_period_end', nowIso)
    .in('tier', ['premium', 'diamond'])
  const tierMap = new Map<string, string>(
    (subs ?? [])
      .filter((s: { status: string; current_period_end: string | null }) => isSubscriptionCurrentlyActive(s))
      .map((s: { advisor_id: string; tier: string }) => [s.advisor_id, s.tier])
  )
  return rows.map((r) => mapRow(r, tierMap.get(r.id as string)))
}

// Statuses that should be visible in the public marketplace.
// 'pending' is included because advisors register as 'active' via the API;
// any manually-inserted row defaults to 'pending' and should still appear.
const VISIBLE_STATUSES = ['active', 'pending'] as const

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()
  let rows: Record<string, unknown>[]
  try {
    rows = await selectAdvisorRows((columns) =>
      supabase
        .from('advisors')
        .select(columns)
        .in('status', VISIBLE_STATUSES)
        .order('views_count', { ascending: false })
    )
  } catch (error) {
    console.error('[getAllProfiles]', (error as { message?: string }).message)
    return []
  }
  const profiles = await enrichWithSubscriptions(supabase, rows)
  return sortByTier(profiles)
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const supabase = createAdminClient()
  let rows: Record<string, unknown>[]
  try {
    rows = await selectAdvisorRows((columns) =>
      supabase
        .from('advisors')
        .select(columns)
        .eq('slug', slug)
    )
  } catch (error) {
    console.error('[getProfileBySlug]', (error as { message?: string }).message)
    return null
  }
  const row = rows[0]
  if (!row) return null
  const nowIso = new Date().toISOString()
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .eq('advisor_id', row.id as string)
    .eq('status', 'active')
    .gt('current_period_end', nowIso)
    .in('tier', ['premium', 'diamond'])
    .maybeSingle()
  return mapRow(row, isSubscriptionCurrentlyActive(subs) ? subs?.tier : undefined)
}

export async function getFeaturedProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  // Advisors with an active paid subscription — these are "featured"
  const { data: paidSubs } = await supabase
    .from('subscriptions')
    .select('advisor_id, tier, status, current_period_end')
    .eq('status', 'active')
    .gt('current_period_end', nowIso)
    .in('tier', ['premium', 'diamond'])

  const activePaidSubs = (paidSubs ?? []).filter((subscription) => isSubscriptionCurrentlyActive(subscription))

  if (activePaidSubs.length > 0) {
    const paidIds = activePaidSubs.map((s: { advisor_id: string }) => s.advisor_id)
    const tierMap = new Map<string, string>(
      activePaidSubs.map((s: { advisor_id: string; tier: string }) => [s.advisor_id, s.tier])
    )
    let rows: Record<string, unknown>[]
    try {
      rows = await selectAdvisorRows((columns) =>
        supabase
          .from('advisors')
          .select(columns)
          .in('id', paidIds)
          .in('status', VISIBLE_STATUSES)
          .order('views_count', { ascending: false })
          .limit(12)
      )
    } catch (error) {
      console.error('[getFeaturedProfiles]', (error as { message?: string }).message)
      return []
    }
    const profiles = rows.map((r) =>
      mapRow(r, tierMap.get(r.id as string))
    )
    return sortByTier(profiles)
  }

  // Fallback: most-viewed visible advisors when no paid subscriptions exist yet
  try {
    const rows = await selectAdvisorRows((columns) =>
      supabase
        .from('advisors')
        .select(columns)
        .in('status', VISIBLE_STATUSES)
        .order('views_count', { ascending: false })
        .limit(12)
    )
    return rows.map((r) => mapRow(r))
  } catch (error) {
    console.error('[getFeaturedProfiles]', (error as { message?: string }).message)
    return []
  }
}

export async function getRecentProfiles(): Promise<Profile[]> {
  const supabase = createAdminClient()
  try {
    const rows = await selectAdvisorRows((columns) =>
      supabase
        .from('advisors')
        .select(columns)
        .in('status', VISIBLE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(12)
    )
    return enrichWithSubscriptions(supabase, rows)
  } catch (error) {
    console.error('[getRecentProfiles]', (error as { message?: string }).message)
    return []
  }
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
  let rows: Record<string, unknown>[]
  try {
    rows = await selectAdvisorRows((columns) => {
      let q = supabase
        .from('advisors')
        .select(columns)
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

      return q
    })
  } catch (error) {
    console.error('[searchProfiles]', (error as { message?: string }).message)
    return []
  }

  const result = await enrichWithSubscriptions(supabase, rows)

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
    const selectedCity = findDutchCity(row.city)
    if (!selectedCity) continue
    const city = selectedCity.city
    const existing = cityMap.get(city)
    if (existing) {
      existing.count++
    } else {
      cityMap.set(city, { count: 1, region: selectedCity.region })
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

  const cityCount = new Set(
    (cityData ?? [])
      .map((r: { city: string }) => findDutchCity(r.city)?.city)
      .filter(Boolean)
  ).size

  return {
    totalAdvisors: count ?? 0,
    totalCities: cityCount,
  }
}
