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
    city: 'Roma',
    district: 'Prati',
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese', 'Francese'],
    phone: '+39 3** *** **45',
    description:
      'Ciao! Sono Sofia, una ragazza dolce e raffinata che ama le belle conversazioni e i momenti di relax. Offro un servizio esclusivo e discreto per uomini di classe. Disponibile tutti i giorni, su appuntamento.',
    photos: [
      { id: '1a', url: img(10, 400, 520), isMain: true },
      { id: '1b', url: img(20, 400, 520), isMain: false },
      { id: '1c', url: img(30, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Cena', 'Massaggio rilassante', 'Outcall'],
    attributes: {
      height: 168,
      weight: 55,
      hair: 'Castano',
      eyes: 'Verdi',
      measurements: '90-60-90',
      ethnicity: 'Caucasica',
    },
    rates: [
      { duration: 60, price: 150, label: '1 ora' },
      { duration: 120, price: 250, label: '2 ore' },
      { duration: 480, price: 600, label: 'Notte' },
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
    city: 'Milano',
    district: 'Navigli',
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese', 'Spagnolo'],
    phone: '+39 3** *** **12',
    description:
      'Sono Valentina, milanese doc, sofisticata e passionale. Ricevo in un appartamento privato, elegante e riservato. Seleziono personalmente i miei ospiti.',
    photos: [
      { id: '2a', url: img(11, 400, 520), isMain: true },
      { id: '2b', url: img(21, 400, 520), isMain: false },
      { id: '2c', url: img(31, 400, 520), isMain: false },
      { id: '2d', url: img(41, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'GFE', 'Massaggio', 'Incall', 'Outcall'],
    attributes: {
      height: 172,
      weight: 58,
      hair: 'Biondo',
      eyes: 'Azzurri',
      measurements: '88-62-92',
      ethnicity: 'Caucasica',
    },
    rates: [
      { duration: 60, price: 200, label: '1 ora' },
      { duration: 120, price: 350, label: '2 ore' },
      { duration: 480, price: 800, label: 'Notte' },
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
    city: 'Napoli',
    district: 'Chiaia',
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese'],
    phone: '+39 3** *** **78',
    description:
      'Napoletana verace, calda e accogliente. Mi piace mettere a proprio agio i miei ospiti con naturalezza e semplicità. Prima esperienza con me? Non te ne pentirai.',
    photos: [
      { id: '3a', url: img(12, 400, 520), isMain: true },
      { id: '3b', url: img(22, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Massaggio', 'Incall'],
    attributes: {
      height: 162,
      weight: 52,
      hair: 'Nero',
      eyes: 'Marroni',
      measurements: '86-60-88',
      ethnicity: 'Mediterranea',
    },
    rates: [
      { duration: 30, price: 80, label: '30 min' },
      { duration: 60, price: 130, label: '1 ora' },
      { duration: 120, price: 220, label: '2 ore' },
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
    city: 'Firenze',
    district: 'Centro',
    nationality: 'Russa',
    languages: ['Italiano', 'Inglese', 'Russo'],
    phone: '+39 3** *** **33',
    description:
      'Donna elegante e matura, con una personalità forte e seducente. Offro esperienze indimenticabili per uomini che apprezzano la qualità. Discrezione assoluta garantita.',
    photos: [
      { id: '4a', url: img(13, 400, 520), isMain: true },
      { id: '4b', url: img(23, 400, 520), isMain: false },
      { id: '4c', url: img(33, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Cena', 'Viaggio', 'Incall', 'Outcall'],
    attributes: {
      height: 175,
      weight: 60,
      hair: 'Rosso',
      eyes: 'Grigi',
      measurements: '92-65-94',
      ethnicity: 'Est-Europea',
    },
    rates: [
      { duration: 60, price: 180, label: '1 ora' },
      { duration: 120, price: 300, label: '2 ore' },
      { duration: 480, price: 700, label: 'Notte' },
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
    city: 'Torino',
    district: 'San Salvario',
    nationality: 'Italiana',
    languages: ['Italiano', 'Francese'],
    phone: '+39 3** *** **55',
    description:
      'Studentessa universitaria, curiosa e vivace. Disponibile nel tempo libero per incontri piacevoli in un ambiente rilassato e privato. Sono una persona solare!',
    photos: [
      { id: '5a', url: img(14, 400, 520), isMain: true },
      { id: '5b', url: img(24, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Massaggio', 'Incall'],
    attributes: {
      height: 165,
      weight: 54,
      hair: 'Castano chiaro',
      eyes: 'Verdi',
      measurements: '87-61-89',
      ethnicity: 'Caucasica',
    },
    rates: [
      { duration: 60, price: 120, label: '1 ora' },
      { duration: 120, price: 200, label: '2 ore' },
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
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese'],
    phone: '+39 3** *** **90',
    description:
      'Bolognese DOC, amante della buona cucina e dei piaceri della vita. Un mix perfetto di sensualità e intelligenza. Disponibile per incontri a Bologna e dintorni.',
    photos: [
      { id: '6a', url: img(15, 400, 520), isMain: true },
      { id: '6b', url: img(25, 400, 520), isMain: false },
      { id: '6c', url: img(35, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Cena', 'Accompagnatrice', 'Incall', 'Outcall'],
    attributes: {
      height: 170,
      weight: 57,
      hair: 'Castano',
      eyes: 'Marroni',
      measurements: '89-63-91',
      ethnicity: 'Mediterranea',
    },
    rates: [
      { duration: 60, price: 140, label: '1 ora' },
      { duration: 120, price: 240, label: '2 ore' },
      { duration: 480, price: 550, label: 'Notte' },
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
    city: 'Venezia',
    nationality: 'Ucraina',
    languages: ['Italiano', 'Inglese', 'Ucraino', 'Russo'],
    phone: '+39 3** *** **67',
    description:
      'Giovane ed elegante, adoro la magia di Venezia. Sono disponibile per un aperitivo, una cena o una serata indimenticabile. La mia compagnia non deluderà.',
    photos: [
      { id: '7a', url: img(16, 400, 520), isMain: true },
      { id: '7b', url: img(26, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Cena', 'GFE', 'Outcall'],
    attributes: {
      height: 171,
      weight: 56,
      hair: 'Biondo',
      eyes: 'Azzurri',
      measurements: '90-61-90',
      ethnicity: 'Est-Europea',
    },
    rates: [
      { duration: 60, price: 160, label: '1 ora' },
      { duration: 120, price: 270, label: '2 ore' },
      { duration: 480, price: 620, label: 'Notte' },
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
    nationality: 'Italiana',
    languages: ['Italiano'],
    phone: '+39 3** *** **21',
    description:
      'Siciliana solare e passionale. Amo la mia città e sono felice di mostrarti i suoi segreti. Disponibile in tarda serata e weekend.',
    photos: [
      { id: '8a', url: img(17, 400, 520), isMain: true },
      { id: '8b', url: img(27, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Massaggio', 'Incall'],
    attributes: {
      height: 163,
      weight: 51,
      hair: 'Nero',
      eyes: 'Marroni scuro',
      ethnicity: 'Mediterranea',
    },
    rates: [
      { duration: 60, price: 110, label: '1 ora' },
      { duration: 120, price: 190, label: '2 ore' },
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
    city: 'Genova',
    nationality: 'Brasiliana',
    languages: ['Italiano', 'Portoghese', 'Inglese', 'Spagnolo'],
    phone: '+39 3** *** **88',
    description:
      'Brasiliana esplosiva, porta il sole di Rio a Genova. Allegra, spontanea, adoro ballare e divertirmi. Vieni a scoprire il mio calore tipicamente latino!',
    photos: [
      { id: '9a', url: img(18, 400, 520), isMain: true },
      { id: '9b', url: img(28, 400, 520), isMain: false },
      { id: '9c', url: img(38, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Massaggio', 'Accompagnatrice', 'Incall', 'Outcall'],
    attributes: {
      height: 167,
      weight: 58,
      hair: 'Nero',
      eyes: 'Marroni',
      measurements: '91-64-95',
      ethnicity: 'Latina',
    },
    rates: [
      { duration: 60, price: 150, label: '1 ora' },
      { duration: 120, price: 250, label: '2 ore' },
      { duration: 480, price: 580, label: 'Notte' },
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
    city: 'Roma',
    district: 'EUR',
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese', 'Tedesco'],
    phone: '+39 3** *** **44',
    description:
      'Manager di giorno, donna sensuale di sera. Sono una donna indipendente e determinata. Cerco uomini maturi e rispettosi per momenti di qualità.',
    photos: [
      { id: '10a', url: img(19, 400, 520), isMain: true },
      { id: '10b', url: img(29, 400, 520), isMain: false },
      { id: '10c', url: img(39, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Cena', 'Viaggio', 'Incall', 'Outcall'],
    attributes: {
      height: 173,
      weight: 61,
      hair: 'Castano scuro',
      eyes: 'Verdi',
      measurements: '90-65-93',
      ethnicity: 'Caucasica',
    },
    rates: [
      { duration: 60, price: 200, label: '1 ora' },
      { duration: 120, price: 350, label: '2 ore' },
      { duration: 480, price: 750, label: 'Notte' },
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
    nationality: 'Italiana',
    languages: ['Italiano', 'Inglese'],
    phone: '+39 3** *** **76',
    description:
      'Pugliese con carattere. Diretta e simpatica, senza fronzoli. Se vuoi una compagnia onesta e divertente, sono quella giusta.',
    photos: [
      { id: '11a', url: img(40, 400, 520), isMain: true },
      { id: '11b', url: img(50, 400, 520), isMain: false },
    ],
    services: ['Accompagnatrice', 'Massaggio', 'Incall'],
    attributes: {
      height: 164,
      weight: 53,
      hair: 'Castano',
      eyes: 'Marroni',
      ethnicity: 'Mediterranea',
    },
    rates: [
      { duration: 60, price: 100, label: '1 ora' },
      { duration: 120, price: 170, label: '2 ore' },
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
    city: 'Milano',
    district: 'Brera',
    nationality: 'Colombiana',
    languages: ['Italiano', 'Spagnolo', 'Inglese'],
    phone: '+39 3** *** **02',
    description:
      'Colombiana di Medellín, vivace e appassionata. Sono a Milano da tre anni e amo questa città. Ti accompagno a scoprire i locali migliori o semplicemente per una serata tranquilla.',
    photos: [
      { id: '12a', url: img(42, 400, 520), isMain: true },
      { id: '12b', url: img(52, 400, 520), isMain: false },
      { id: '12c', url: img(62, 400, 520), isMain: false },
    ],
    services: ['GFE', 'Accompagnatrice', 'Cena', 'Incall', 'Outcall'],
    attributes: {
      height: 169,
      weight: 57,
      hair: 'Nero',
      eyes: 'Marroni',
      measurements: '93-65-96',
      ethnicity: 'Latina',
    },
    rates: [
      { duration: 60, price: 170, label: '1 ora' },
      { duration: 120, price: 290, label: '2 ore' },
      { duration: 480, price: 650, label: 'Notte' },
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
  { id: '1', slug: 'accompagnatrici', label: 'Accompagnatrici', icon: '💃', count: 1240 },
  { id: '2', slug: 'massaggi', label: 'Massaggi', icon: '💆', count: 380 },
  { id: '3', slug: 'trans', label: 'Trans', icon: '⭐', count: 210 },
  { id: '4', slug: 'dominazione', label: 'Dominazione', icon: '🔥', count: 95 },
  { id: '5', slug: 'coppie', label: 'Coppie', icon: '💑', count: 67 },
  { id: '6', slug: 'amatoriali', label: 'Amatoriali', icon: '📸', count: 430 },
  { id: '7', slug: 'viaggio', label: 'Viaggio', icon: '✈️', count: 145 },
  { id: '8', slug: 'virtual', label: 'Virtual', icon: '📱', count: 320 },
];

export const MOCK_CITIES: City[] = [
  { id: '1', name: 'Roma', count: 423, region: 'Lazio' },
  { id: '2', name: 'Milano', count: 387, region: 'Lombardia' },
  { id: '3', name: 'Napoli', count: 198, region: 'Campania' },
  { id: '4', name: 'Torino', count: 154, region: 'Piemonte' },
  { id: '5', name: 'Firenze', count: 132, region: 'Toscana' },
  { id: '6', name: 'Bologna', count: 121, region: 'Emilia-Romagna' },
  { id: '7', name: 'Venezia', count: 89, region: 'Veneto' },
  { id: '8', name: 'Palermo', count: 76, region: 'Sicilia' },
  { id: '9', name: 'Genova', count: 68, region: 'Liguria' },
  { id: '10', name: 'Bari', count: 61, region: 'Puglia' },
  { id: '11', name: 'Catania', count: 55, region: 'Sicilia' },
  { id: '12', name: 'Verona', count: 48, region: 'Veneto' },
];

export const AVAILABLE_SERVICES = [
  'Accompagnatrice',
  'GFE',
  'Massaggio',
  'Massaggio erotico',
  'Dominazione',
  'Cena',
  'Viaggio',
  'Incall',
  'Outcall',
  'Virtual',
  'Webcam',
  'Coppie',
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
