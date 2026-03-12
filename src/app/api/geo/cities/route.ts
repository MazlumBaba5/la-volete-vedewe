import { NextResponse } from 'next/server'
import { searchDutchCities } from '@/lib/netherlands-cities'

export interface GeoCity {
  city: string
  region: string
  displayName: string
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const results: GeoCity[] = searchDutchCities(q).map((item) => ({
      city: item.city,
      region: item.region,
      displayName: `${item.city}, ${item.region}, Netherlands`,
    }))

    return NextResponse.json(results)
  } catch (err) {
    console.error('[geo/cities]', err)
    return NextResponse.json([])
  }
}
