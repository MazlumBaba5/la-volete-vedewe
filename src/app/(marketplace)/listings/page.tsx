// src/app/(marketplace)/listings/page.tsx
import { getAllProfiles, getCities } from '@/services/advisor.service'
import { findDutchCity } from '@/lib/netherlands-cities'
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
  if (params.category) initialFilters.category = String(params.category) as SearchFilters['category']
  const selectedCity = findDutchCity(typeof params.city === 'string' ? params.city : undefined)
  if (selectedCity) {
    initialFilters.city = selectedCity.city
    initialFilters.region = selectedCity.region
  } else if (params.region) {
    initialFilters.region = String(params.region)
  }
  if (params.tier) initialFilters.subscriptionLevel = String(params.tier) as SearchFilters['subscriptionLevel']
  if (params.verified) initialFilters.verified = true
  if (params.minAge) initialFilters.minAge = Number(params.minAge)
  if (params.maxAge) initialFilters.maxAge = Number(params.maxAge)
  if (params.services) {
    const values = Array.isArray(params.services) ? params.services : [params.services]
    const services = values
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim())
      .filter(Boolean)

    if (services.length > 0) {
      initialFilters.services = services
    }
  }

  return <ListingsClient initialProfiles={profiles} cities={cities} initialFilters={initialFilters} />
}
