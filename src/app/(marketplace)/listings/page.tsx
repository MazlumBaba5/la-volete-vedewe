// src/app/(marketplace)/listings/page.tsx
import { getAllProfiles, getCities } from '@/services/advisor.service'
import type { SearchFilters } from '@/types'
import ListingsClient from './ListingsClient'

export const revalidate = 60

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams
  const [profiles, cities] = await Promise.all([getAllProfiles(), getCities()])

  const initialFilters: SearchFilters = {}
  if (params.q) initialFilters.query = String(params.q)
  if (params.city) initialFilters.city = String(params.city)
  if (params.tier) initialFilters.subscriptionLevel = String(params.tier) as SearchFilters['subscriptionLevel']
  if (params.verified) initialFilters.verified = true
  if (params.minAge) initialFilters.minAge = Number(params.minAge)
  if (params.maxAge) initialFilters.maxAge = Number(params.maxAge)

  return <ListingsClient initialProfiles={profiles} cities={cities} initialFilters={initialFilters} />
}