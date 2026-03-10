// src/app/(marketplace)/listings/page.tsx
import { getAllProfiles, getCities } from '@/services/advisor.service'
import ListingsClient from './ListingsClient'

export const revalidate = 60

export default async function ListingsPage() {
  const [profiles, cities] = await Promise.all([getAllProfiles(), getCities()])
  return <ListingsClient initialProfiles={profiles} cities={cities} />
}