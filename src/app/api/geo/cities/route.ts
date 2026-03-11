import { NextResponse } from 'next/server'

export interface GeoCity {
  city: string
  region: string
  displayName: string
}

type NominatimResult = {
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    state?: string
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json` +
      `&q=${encodeURIComponent(q)}` +
      `&limit=8` +
      `&addressdetails=1` +
      `&featuretype=city`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'MarketplaceAdvisor/1.0',
        'Accept-Language': 'en',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error('[geo/cities] Nominatim responded', res.status)
      return NextResponse.json([])
    }

    const data: NominatimResult[] = await res.json()

    const seen = new Set<string>()
    const results: GeoCity[] = []

    for (const item of data) {
      const cityName =
        item.address.city ||
        item.address.town ||
        item.address.village ||
        item.address.municipality ||
        ''
      if (!cityName) continue
      if (seen.has(cityName)) continue
      seen.add(cityName)
      results.push({
        city: cityName,
        region: item.address.state ?? '',
        displayName: item.display_name,
      })
    }

    return NextResponse.json(results)
  } catch (err) {
    console.error('[geo/cities]', err)
    return NextResponse.json([])
  }
}
