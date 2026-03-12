import type { ProfileRate } from '@/types';

export const ADVISOR_ETHNICITIES = [
  'Dutch',
  'European',
  'Eastern European',
  'Southern European',
  'African',
  'Asian',
  'Latina',
  'Arabic',
  'Turkish',
  'Moroccan',
  'American',
  'Hindustani',
  'Brazilian',
  'Chinese',
  'Polish',
  'Russian',
  'Thai',
] as const;

export const DATE_TYPE_OPTIONS = [
  'Incall',
  'Outcall',
  'Massage',
  'Bdsm',
  'SexCam',
] as const;

export const SEX_ORIENTATION_OPTIONS = [
  'Straight',
  'Lesbian',
  'Gay',
  'Bisex',
] as const;

export const PRICE_DURATION_OPTIONS = [
  { code: 'quickie', label: 'Quickie', duration: 15 },
  { code: '30m', label: '30 min', duration: 30 },
  { code: '1h', label: '1 hour', duration: 60 },
  { code: '90m', label: '90 min', duration: 90 },
  { code: '2h', label: '2 hours', duration: 120 },
  { code: '3h', label: '3 hours', duration: 180 },
  { code: '6h', label: '6 hours', duration: 360 },
  { code: '12h', label: '12 hours', duration: 720 },
  { code: '1d', label: '1 day', duration: 1440 },
] as const;

export const GENERAL_SERVICE_OPTIONS = [
  'Handjob',
  'Anal at customer',
  'Anal with condom',
  'Anal without condom',
  'Pussyeating with dental dam',
  'Pussyeating without dental dam',
  'Bisex',
  'Outdoor sex',
  'Cardate',
  'Deepthroat',
  'Dinner date',
  'Erotic massage',
  'Facesitting',
  'Fisting',
  'Fisting at customer',
  'Gagging / Gags',
  'Gangbang',
  'GFE',
  'High class',
  'Hotel',
  'Cumming in mouth',
  'Cumming on face',
  'Fucking with condom',
  'Fucking without condom',
  'Defloration service',
  'Penis massage',
  'Blowjob with condom',
  'Blowjob without condom',
  'Golden shower',
  'Golden shower by customer',
  'Pornstar',
  'Rimming at customer',
  'Soft SM',
  'Special clothing request',
  'Cum swallow',
  'Squirting',
  'French kiss',
  'Travestie',
  'Trio m/m',
  'Trio m/w',
  'Between tits (Russian)',
  'Video recording',
  'Fingering',
  'Feetlover',
  'Strapon sex',
  'Wapdate',
  'Wrestling',
  'Kissing',
] as const;

export const BDSM_SERVICE_OPTIONS = [
  'BDSM',
  'Anal play',
  'Ass worship',
  'BDSM customer dominant',
  'BDSM customer submissive',
  'Bi-slave sessions',
  'Bondage',
  'Boot / High heel worship',
  'Breath play',
  'CBT (cock and ball torture)',
  'Candle wax play',
  'Chastity belt',
  'Cock and balls bondage',
  'Confinement',
  'Electro / Violet wand',
  'Facesitting',
  'Fisting',
  'Foot worship',
  'Golden shower',
  'Golden shower by customer',
  'Humiliation',
  'Intimate',
  'Lacquer / Rubber',
  'Masks',
  'Masturbation',
  'Money slaves',
  'Mummification',
  'Needles',
  'Nipple torture',
  'Nursing',
  'Public exhibition',
  'Sissyplay',
  'Soft SM',
  'Spanking',
  'Spitting',
  'Strapon sex',
  'Travestie',
  'Urethral sounding',
  'Verbal humiliation',
  'Video recording',
] as const;

export const MASSAGE_SERVICE_OPTIONS = [
  'Erotic massage',
  'Between tits (Russian)',
  'Body to body',
  'Intimate',
  'Lingam massage',
  'Massage with happy end',
  'Nuru massage',
  'Penis massage',
  'Prostate massage',
  'SM massage',
  'Tantra massage',
  'Thaise massage',
  'Yoni massage',
] as const;

export const VIRTUAL_SERVICE_OPTIONS = [
  'Virtual Sex',
  'Chatten',
  'Dickrating',
  'Dildo show',
  'Dirty talk',
  'Face check',
  'Facetime',
  'JOI - jerk-off instructions',
  'Kik',
  'Live horny stories',
  'Online femdom',
  'Online findom',
  'Only fans',
  'Phone sex',
  'Photos on request',
  'Role play game',
  'Skype',
  'Snapchat',
  'Squirtshow',
  'Telegram',
  'Video call',
  'Videos on Request',
  'Webcam',
  'Whatsapp',
  'Zoom',
] as const;

export const AVAILABILITY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const AVAILABILITY_TIME_OPTIONS = [
  'Morning',
  'Afternoon',
  'Evening',
  'Night',
  'Full day',
] as const;

export const AVAILABILITY_SLOT_OPTIONS = AVAILABILITY_DAYS.flatMap((day) =>
  AVAILABILITY_TIME_OPTIONS.map((time) => `${day} - ${time}`)
);

export type AdvisorEthnicity = (typeof ADVISOR_ETHNICITIES)[number];
export type DateTypeOption = (typeof DATE_TYPE_OPTIONS)[number];
export type SexOrientation = (typeof SEX_ORIENTATION_OPTIONS)[number];
export type PriceDurationOption = (typeof PRICE_DURATION_OPTIONS)[number];
export type PriceCode = PriceDurationOption['code'];

export type StoredRate = {
  code: PriceCode;
  label: string;
  duration: number;
  price: number;
  type: 'incall' | 'outcall';
};

export type RateFormState = Record<PriceCode, string>;

const ETHNICITY_SET = new Set<string>(ADVISOR_ETHNICITIES);
const DATE_TYPE_SET = new Set<string>(DATE_TYPE_OPTIONS);
const SEX_ORIENTATION_SET = new Set<string>(SEX_ORIENTATION_OPTIONS);
const AVAILABILITY_SLOT_SET = new Set<string>(AVAILABILITY_SLOT_OPTIONS);
const SERVICE_SET = new Set<string>([
  ...GENERAL_SERVICE_OPTIONS,
  ...BDSM_SERVICE_OPTIONS,
  ...MASSAGE_SERVICE_OPTIONS,
  ...VIRTUAL_SERVICE_OPTIONS,
]);

export function isAdvisorEthnicity(value: string): value is AdvisorEthnicity {
  return ETHNICITY_SET.has(value);
}

export function isSexOrientation(value: string): value is SexOrientation {
  return SEX_ORIENTATION_SET.has(value);
}

export function sanitizeDateTypes(values: unknown): DateTypeOption[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string' && DATE_TYPE_SET.has(value))
    )
  ) as DateTypeOption[];
}

export function sanitizeServices(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === 'string' && SERVICE_SET.has(value))
    )
  );
}

export function sanitizeAvailabilitySlots(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values.filter((value): value is string => typeof value === 'string' && AVAILABILITY_SLOT_SET.has(value))
    )
  );
}

export function deriveAvailability(dateTypes: DateTypeOption[]): 'incall' | 'outcall' | 'both' {
  const hasIncall = dateTypes.includes('Incall');
  const hasOutcall = dateTypes.includes('Outcall');
  if (hasIncall && hasOutcall) return 'both';
  if (hasOutcall) return 'outcall';
  return 'incall';
}

export function sanitizeRates(values: unknown, type: 'incall' | 'outcall'): StoredRate[] {
  if (!Array.isArray(values)) return [];

  return values.reduce<StoredRate[]>((acc, value) => {
      if (!value || typeof value !== 'object') return acc;
      const entry = value as Record<string, unknown>;
      const option = PRICE_DURATION_OPTIONS.find((item) => item.code === entry.code);
      const price = typeof entry.price === 'number'
        ? entry.price
        : typeof entry.price === 'string'
        ? Number(entry.price)
        : NaN;

      if (!option || !Number.isFinite(price) || price <= 0) return acc;

      acc.push({
        code: option.code,
        label: option.label,
        duration: option.duration,
        price: Math.round(price),
        type,
      });

      return acc;
    }, []).sort((a, b) => a.duration - b.duration);
}

export function createEmptyRateState(): RateFormState {
  return PRICE_DURATION_OPTIONS.reduce((acc, option) => {
    acc[option.code] = '';
    return acc;
  }, {} as RateFormState);
}

export function ratesToFormState(values: unknown): RateFormState {
  const next = createEmptyRateState();
  for (const rate of sanitizeRates(values, 'incall')) {
    next[rate.code] = String(rate.price);
  }
  for (const rate of sanitizeRates(values, 'outcall')) {
    next[rate.code] = String(rate.price);
  }
  return next;
}

export function buildRatesFromForm(
  values: RateFormState,
  type: 'incall' | 'outcall'
): StoredRate[] {
  return PRICE_DURATION_OPTIONS.reduce<StoredRate[]>((acc, option) => {
      const raw = values[option.code];
      const price = Number(raw);
      if (!raw || !Number.isFinite(price) || price <= 0) return acc;
      acc.push({
        code: option.code,
        label: option.label,
        duration: option.duration,
        price: Math.round(price),
        type,
      });
      return acc;
    }, []);
}

export function toPublicRates(incallRates: unknown, outcallRates: unknown): ProfileRate[] {
  return [
    ...sanitizeRates(incallRates, 'incall').map((rate) => ({
      duration: rate.duration,
      label: `InCall · ${rate.label}`,
      price: rate.price,
    })),
    ...sanitizeRates(outcallRates, 'outcall').map((rate) => ({
      duration: rate.duration,
      label: `OutCall · ${rate.label}`,
      price: rate.price,
    })),
  ].sort((a, b) => a.duration - b.duration || a.price - b.price);
}
