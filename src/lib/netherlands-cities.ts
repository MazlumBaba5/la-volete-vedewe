export type DutchCity = {
  city: string
  region: string
}

export const DUTCH_CITIES: DutchCity[] = [
  { city: 'Amsterdam', region: 'North Holland' },
  { city: 'Rotterdam', region: 'South Holland' },
  { city: 'Den Haag', region: 'South Holland' },
  { city: 'Utrecht', region: 'Utrecht' },
  { city: 'Eindhoven', region: 'North Brabant' },
  { city: 'Groningen', region: 'Groningen' },
  { city: 'Tilburg', region: 'North Brabant' },
  { city: 'Almere', region: 'Flevoland' },
  { city: 'Breda', region: 'North Brabant' },
  { city: 'Nijmegen', region: 'Gelderland' },
  { city: 'Enschede', region: 'Overijssel' },
  { city: 'Haarlem', region: 'North Holland' },
  { city: 'Arnhem', region: 'Gelderland' },
  { city: 'Zaanstad', region: 'North Holland' },
  { city: 'Amersfoort', region: 'Utrecht' },
  { city: 'Apeldoorn', region: 'Gelderland' },
  { city: 'Hoofddorp', region: 'North Holland' },
  { city: 'Maastricht', region: 'Limburg' },
  { city: 'Leiden', region: 'South Holland' },
  { city: 'Dordrecht', region: 'South Holland' },
  { city: 'Zoetermeer', region: 'South Holland' },
  { city: 'Zwolle', region: 'Overijssel' },
  { city: 'Deventer', region: 'Overijssel' },
  { city: 'Leeuwarden', region: 'Friesland' },
  { city: 'Delft', region: 'South Holland' },
  { city: 'Heerlen', region: 'Limburg' },
  { city: 'Alkmaar', region: 'North Holland' },
  { city: 'Venlo', region: 'Limburg' },
  { city: 'Helmond', region: 'North Brabant' },
  { city: 'Hilversum', region: 'North Holland' },
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function findDutchCity(value?: string | null): DutchCity | null {
  if (!value) return null
  const normalized = normalize(value)
  return DUTCH_CITIES.find((item) => normalize(item.city) === normalized) ?? null
}

export function sanitizeDutchCity(value?: string | null): string | null {
  return findDutchCity(value)?.city ?? null
}

export function getDutchRegion(value?: string | null): string {
  return findDutchCity(value)?.region ?? ''
}

export function searchDutchCities(query?: string | null, limit = 8): DutchCity[] {
  const normalized = normalize(query ?? '')
  if (normalized.length < 2) return []

  return DUTCH_CITIES
    .filter((item) => normalize(item.city).includes(normalized))
    .sort((a, b) => {
      const aStarts = normalize(a.city).startsWith(normalized) ? 0 : 1
      const bStarts = normalize(b.city).startsWith(normalized) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.city.localeCompare(b.city)
    })
    .slice(0, limit)
}
