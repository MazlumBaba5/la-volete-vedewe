import type { Profile, Category, City } from '@/types';

// ─── Placeholder images using picsum (replace with real Cloudinary URLs) ───
const img = (seed: number, w = 400, h = 500) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const MOCK_PROFILES: Profile[] = [
  {
    id: '1',
    slug: 'sofia-roma',
    name: 'Sofia',
    age: 24,
    city: 'Rome',
    district: 'Prati',
    nationality: 'Italian',
    languages: ['Italian', 'English', 'French'],
    phone: '+39 3** *** **45',
    description:
      "Hi! I'm Sofia, a sweet and refined girl who loves great conversations and relaxing moments. I offer an exclusive, discreet service for gentlemen of class. Available daily, by appointment.",
    photos: [
      { id: '1a', url: img(10, 400, 520), isMain: true },
      { id: '1b', url: img(20, 400, 520), isMain: false },
      { id: '1c', url: img(30, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Dinner', 'Relaxing Massage', 'Outcall'],
    attributes: {
      height: 168,
      weight: 55,
      hair: 'Brown',
      eyes: 'Green',
      measurements: '90-60-90',
      ethnicity: 'Caucasian',
    },
    rates: [
      { duration: 60, price: 150, label: '1 hour' },
      { duration: 120, price: 250, label: '2 hours' },
      { duration: 480, price: 600, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: true,
    subscriptionLevel: 'diamond',
    views: 4821,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-03-08T18:30:00Z',
  },
  {
    id: '2',
    slug: 'valentina-milano',
    name: 'Valentina',
    age: 27,
    city: 'Milan',
    district: 'Navigli',
    nationality: 'Italian',
    languages: ['Italian', 'English', 'Spanish'],
    phone: '+39 3** *** **12',
    description:
      "I'm Valentina, a true Milanese \u2013 sophisticated and passionate. I receive in a private, elegant and reserved apartment. I personally select my guests.",
    photos: [
      { id: '2a', url: img(11, 400, 520), isMain: true },
      { id: '2b', url: img(21, 400, 520), isMain: false },
      { id: '2c', url: img(31, 400, 520), isMain: false },
      { id: '2d', url: img(41, 400, 520), isMain: false },
    ],
    services: ['Companion', 'GFE', 'Massage', 'Incall', 'Outcall'],
    attributes: {
      height: 172,
      weight: 58,
      hair: 'Blond',
      eyes: 'Blue',
      measurements: '88-62-92',
      ethnicity: 'Caucasian',
    },
    rates: [
      { duration: 60, price: 200, label: '1 hour' },
      { duration: 120, price: 350, label: '2 hours' },
      { duration: 480, price: 800, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: true,
    subscriptionLevel: 'diamond',
    views: 6103,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-03-09T09:00:00Z',
  },
  {
    id: '3',
    slug: 'alessia-napoli',
    name: 'Alessia',
    age: 22,
    city: 'Naples',
    district: 'Chiaia',
    nationality: 'Italian',
    languages: ['Italian', 'English'],
    phone: '+39 3** *** **78',
    description:
      "A true Neapolitan girl, warm and welcoming. I love putting my guests at ease with a natural and simple approach. First time with me? You won't regret it.",
    photos: [
      { id: '3a', url: img(12, 400, 520), isMain: true },
      { id: '3b', url: img(22, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Massage', 'Incall'],
    attributes: {
      height: 162,
      weight: 52,
      hair: 'Black',
      eyes: 'Brown',
      measurements: '86-60-88',
      ethnicity: 'Mediterranean',
    },
    rates: [
      { duration: 30, price: 80, label: '30 min' },
      { duration: 60, price: 130, label: '1 hour' },
      { duration: 120, price: 220, label: '2 hours' },
    ],
    availability: 'available',
    isVerified: false,
    isOnline: true,
    subscriptionLevel: 'premium',
    views: 2340,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-03-09T11:00:00Z',
  },
  {
    id: '4',
    slug: 'elena-firenze',
    name: 'Elena',
    age: 30,
    city: 'Florence',
    district: 'City Center',
    nationality: 'Russian',
    languages: ['Italian', 'English', 'Russian'],
    phone: '+39 3** *** **33',
    description:
      'An elegant and mature woman with a strong and seductive personality. I offer unforgettable experiences for men who appreciate quality. Absolute discretion guaranteed.',
    photos: [
      { id: '4a', url: img(13, 400, 520), isMain: true },
      { id: '4b', url: img(23, 400, 520), isMain: false },
      { id: '4c', url: img(33, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Dinner', 'Travel', 'Incall', 'Outcall'],
    attributes: {
      height: 175,
      weight: 60,
      hair: 'Red',
      eyes: 'Grey',
      measurements: '92-65-94',
      ethnicity: 'Eastern European',
    },
    rates: [
      { duration: 60, price: 180, label: '1 hour' },
      { duration: 120, price: 300, label: '2 hours' },
      { duration: 480, price: 700, label: 'Night' },
    ],
    availability: 'busy',
    isVerified: true,
    isOnline: false,
    subscriptionLevel: 'premium',
    views: 3892,
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-03-07T16:00:00Z',
  },
  {
    id: '5',
    slug: 'isabella-torino',
    name: 'Isabella',
    age: 25,
    city: 'Turin',
    district: 'San Salvario',
    nationality: 'Italian',
    languages: ['Italian', 'French'],
    phone: '+39 3** *** **55',
    description:
      "University student, curious and lively. Available in my free time for pleasant encounters in a relaxed, private setting. I'm a sunny person!",
    photos: [
      { id: '5a', url: img(14, 400, 520), isMain: true },
      { id: '5b', url: img(24, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Massage', 'Incall'],
    attributes: {
      height: 165,
      weight: 54,
      hair: 'Light Brown',
      eyes: 'Green',
      measurements: '87-61-89',
      ethnicity: 'Caucasian',
    },
    rates: [
      { duration: 60, price: 120, label: '1 hour' },
      { duration: 120, price: 200, label: '2 hours' },
    ],
    availability: 'available',
    isVerified: false,
    isOnline: true,
    subscriptionLevel: 'free',
    views: 1205,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-03-09T08:00:00Z',
  },
  {
    id: '6',
    slug: 'camilla-bologna',
    name: 'Camilla',
    age: 28,
    city: 'Bologna',
    nationality: 'Italian',
    languages: ['Italian', 'English'],
    phone: '+39 3** *** **90',
    description:
      'A true Bolognese, lover of good food and the pleasures of life. A perfect blend of sensuality and intelligence. Available for encounters in and around Bologna.',
    photos: [
      { id: '6a', url: img(15, 400, 520), isMain: true },
      { id: '6b', url: img(25, 400, 520), isMain: false },
      { id: '6c', url: img(35, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Dinner', 'Companion', 'Incall', 'Outcall'],
    attributes: {
      height: 170,
      weight: 57,
      hair: 'Brown',
      eyes: 'Brown',
      measurements: '89-63-91',
      ethnicity: 'Mediterranean',
    },
    rates: [
      { duration: 60, price: 140, label: '1 hour' },
      { duration: 120, price: 240, label: '2 hours' },
      { duration: 480, price: 550, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: false,
    subscriptionLevel: 'premium',
    views: 2780,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-03-08T20:00:00Z',
  },
  {
    id: '7',
    slug: 'natasha-venezia',
    name: 'Natasha',
    age: 23,
    city: 'Venice',
    nationality: 'Ukrainian',
    languages: ['Italian', 'English', 'Ukrainian', 'Russian'],
    phone: '+39 3** *** **67',
    description:
      'Young and elegant, I love the magic of Venice. Available for an aperitivo, dinner or an unforgettable evening. My company will not disappoint.',
    photos: [
      { id: '7a', url: img(16, 400, 520), isMain: true },
      { id: '7b', url: img(26, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Dinner', 'GFE', 'Outcall'],
    attributes: {
      height: 171,
      weight: 56,
      hair: 'Blond',
      eyes: 'Blue',
      measurements: '90-61-90',
      ethnicity: 'Eastern European',
    },
    rates: [
      { duration: 60, price: 160, label: '1 hour' },
      { duration: 120, price: 270, label: '2 hours' },
      { duration: 480, price: 620, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: true,
    subscriptionLevel: 'diamond',
    views: 3455,
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-03-09T10:30:00Z',
  },
  {
    id: '8',
    slug: 'giulia-palermo',
    name: 'Giulia',
    age: 21,
    city: 'Palermo',
    nationality: 'Italian',
    languages: ['Italian'],
    phone: '+39 3** *** **21',
    description:
      "A sunny and passionate Sicilian girl. I love my city and I'm happy to show you its secrets. Available late evenings and weekends.",
    photos: [
      { id: '8a', url: img(17, 400, 520), isMain: true },
      { id: '8b', url: img(27, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Massage', 'Incall'],
    attributes: {
      height: 163,
      weight: 51,
      hair: 'Black',
      eyes: 'Dark Brown',
      ethnicity: 'Mediterranean',
    },
    rates: [
      { duration: 60, price: 110, label: '1 hour' },
      { duration: 120, price: 190, label: '2 hours' },
    ],
    availability: 'available',
    isVerified: false,
    isOnline: false,
    subscriptionLevel: 'free',
    views: 987,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-03-06T14:00:00Z',
  },
  {
    id: '9',
    slug: 'luna-genova',
    name: 'Luna',
    age: 26,
    city: 'Genoa',
    nationality: 'Brazilian',
    languages: ['Italian', 'Portuguese', 'English', 'Spanish'],
    phone: '+39 3** *** **88',
    description:
      'An explosive Brazilian girl bringing the sun of Rio to Genoa. Cheerful, spontaneous, I love dancing and having fun. Come discover my typical Latin warmth!',
    photos: [
      { id: '9a', url: img(18, 400, 520), isMain: true },
      { id: '9b', url: img(28, 400, 520), isMain: false },
      { id: '9c', url: img(38, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Massage', 'Companion', 'Incall', 'Outcall'],
    attributes: {
      height: 167,
      weight: 58,
      hair: 'Black',
      eyes: 'Brown',
      measurements: '91-64-95',
      ethnicity: 'Latina',
    },
    rates: [
      { duration: 60, price: 150, label: '1 hour' },
      { duration: 120, price: 250, label: '2 hours' },
      { duration: 480, price: 580, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: true,
    subscriptionLevel: 'premium',
    views: 3100,
    createdAt: '2026-02-03T10:00:00Z',
    updatedAt: '2026-03-09T07:00:00Z',
  },
  {
    id: '10',
    slug: 'diana-roma',
    name: 'Diana',
    age: 32,
    city: 'Rome',
    district: 'EUR',
    nationality: 'Italian',
    languages: ['Italian', 'English', 'German'],
    phone: '+39 3** *** **44',
    description:
      'A manager by day, a sensual woman by night. I am an independent and determined woman. I seek mature and respectful men for quality time.',
    photos: [
      { id: '10a', url: img(19, 400, 520), isMain: true },
      { id: '10b', url: img(29, 400, 520), isMain: false },
      { id: '10c', url: img(39, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Dinner', 'Travel', 'Incall', 'Outcall'],
    attributes: {
      height: 173,
      weight: 61,
      hair: 'Dark Brown',
      eyes: 'Green',
      measurements: '90-65-93',
      ethnicity: 'Caucasian',
    },
    rates: [
      { duration: 60, price: 200, label: '1 hour' },
      { duration: 120, price: 350, label: '2 hours' },
      { duration: 480, price: 750, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: false,
    subscriptionLevel: 'diamond',
    views: 5220,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-03-08T21:00:00Z',
  },
  {
    id: '11',
    slug: 'sara-bari',
    name: 'Sara',
    age: 24,
    city: 'Bari',
    nationality: 'Italian',
    languages: ['Italian', 'English'],
    phone: '+39 3** *** **76',
    description:
      "A girl from Puglia with character. Straightforward and fun, no fuss. If you want honest and entertaining company, I'm the right choice.",
    photos: [
      { id: '11a', url: img(40, 400, 520), isMain: true },
      { id: '11b', url: img(50, 400, 520), isMain: false },
    ],
    services: ['Companion', 'Massage', 'Incall'],
    attributes: {
      height: 164,
      weight: 53,
      hair: 'Brown',
      eyes: 'Brown',
      ethnicity: 'Mediterranean',
    },
    rates: [
      { duration: 60, price: 100, label: '1 hour' },
      { duration: 120, price: 170, label: '2 hours' },
    ],
    availability: 'offline',
    isVerified: false,
    isOnline: false,
    subscriptionLevel: 'free',
    views: 788,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-03-05T12:00:00Z',
  },
  {
    id: '12',
    slug: 'monica-milano',
    name: 'Monica',
    age: 29,
    city: 'Milan',
    district: 'Brera',
    nationality: 'Colombian',
    languages: ['Italian', 'Spanish', 'English'],
    phone: '+39 3** *** **02',
    description:
      "A Colombian girl from Medell\u00edn, lively and passionate. I've been in Milan for three years and love this city. I'll take you to discover the best venues or simply for a quiet evening.",
    photos: [
      { id: '12a', url: img(42, 400, 520), isMain: true },
      { id: '12b', url: img(52, 400, 520), isMain: false },
      { id: '12c', url: img(62, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Companion', 'Dinner', 'Incall', 'Outcall'],
    attributes: {
      height: 169,
      weight: 57,
      hair: 'Black',
      eyes: 'Brown',
      measurements: '93-65-96',
      ethnicity: 'Latina',
    },
    rates: [
      { duration: 60, price: 170, label: '1 hour' },
      { duration: 120, price: 290, label: '2 hours' },
      { duration: 480, price: 650, label: 'Night' },
    ],
    availability: 'available',
    isVerified: true,
    isOnline: true,
    subscriptionLevel: 'diamond',
    views: 4110,
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-03-09T09:45:00Z',
  },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', slug: 'companions', label: 'Companions', icon: '💃', count: 1240 },
  { id: '2', slug: 'massage', label: 'Massage', icon: '💆', count: 380 },
  { id: '3', slug: 'trans', label: 'Trans', icon: '⭐', count: 210 },
  { id: '4', slug: 'domination', label: 'Domination', icon: '🔥', count: 95 },
  { id: '5', slug: 'couples', label: 'Couples', icon: '💑', count: 67 },
  { id: '6', slug: 'amateur', label: 'Amateur', icon: '📸', count: 430 },
  { id: '7', slug: 'travel', label: 'Travel', icon: '✈️', count: 145 },
  { id: '8', slug: 'virtual', label: 'Virtual', icon: '📱', count: 320 },
];

export const MOCK_CITIES: City[] = [
  { id: '1', name: 'Rome', count: 423, region: 'Lazio' },
  { id: '2', name: 'Milan', count: 387, region: 'Lombardy' },
  { id: '3', name: 'Naples', count: 198, region: 'Campania' },
  { id: '4', name: 'Turin', count: 154, region: 'Piedmont' },
  { id: '5', name: 'Florence', count: 132, region: 'Tuscany' },
  { id: '6', name: 'Bologna', count: 121, region: 'Emilia-Romagna' },
  { id: '7', name: 'Venice', count: 89, region: 'Veneto' },
  { id: '8', name: 'Palermo', count: 76, region: 'Sicily' },
  { id: '9', name: 'Genoa', count: 68, region: 'Liguria' },
  { id: '10', name: 'Bari', count: 61, region: 'Puglia' },
  { id: '11', name: 'Catania', count: 55, region: 'Sicily' },
  { id: '12', name: 'Verona', count: 48, region: 'Veneto' },
];

export const AVAILABLE_SERVICES = [
  'Companion',
  'GFE',
  'Massage',
  'Erotic Massage',
  'Domination',
  'Dinner',
  'Travel',
  'Incall',
  'Outcall',
  'Virtual',
  'Webcam',
  'Couples',
];

// Simulated API delay
export const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

export function filterProfiles(
  profiles: Profile[],
  filters: {
    city?: string;
    category?: string;
    minAge?: number;
    maxAge?: number;
    minPrice?: number;
    maxPrice?: number;
    subscriptionLevel?: string;
    verified?: boolean;
    isOnline?: boolean;
    sortBy?: string;
    query?: string;
  }
) {
  let result = [...profiles];

  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q))
    );
  }
  if (filters.city) result = result.filter((p) => p.city === filters.city);
  if (filters.minAge) result = result.filter((p) => p.age >= filters.minAge!);
  if (filters.maxAge) result = result.filter((p) => p.age <= filters.maxAge!);
  if (filters.minPrice)
    result = result.filter((p) => p.rates.some((r) => r.price >= filters.minPrice!));
  if (filters.maxPrice)
    result = result.filter((p) => p.rates.some((r) => r.price <= filters.maxPrice!));
  if (filters.subscriptionLevel)
    result = result.filter((p) => p.subscriptionLevel === filters.subscriptionLevel);
  if (filters.verified) result = result.filter((p) => p.isVerified);
  if (filters.isOnline) result = result.filter((p) => p.isOnline);

  // Sort – diamond always first, then premium, then by chosen sort
  result.sort((a, b) => {
    const tierOrder = { diamond: 0, premium: 1, free: 2 };
    const tierDiff = tierOrder[a.subscriptionLevel] - tierOrder[b.subscriptionLevel];
    if (tierDiff !== 0) return tierDiff;

    switch (filters.sortBy) {
      case 'popular':
        return b.views - a.views;
      case 'price_asc':
        return (a.rates[0]?.price ?? 0) - (b.rates[0]?.price ?? 0);
      case 'price_desc':
        return (b.rates[0]?.price ?? 0) - (a.rates[0]?.price ?? 0);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return result;
}
