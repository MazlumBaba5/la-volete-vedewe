const GUEST_EMAIL_DOMAIN = 'guest.lvvd.local';

export function normalizeGuestUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function isValidGuestUsername(value: string) {
  const normalized = normalizeGuestUsername(value);
  return normalized.length >= 3;
}

export function buildGuestEmail(username: string) {
  return `${normalizeGuestUsername(username)}@${GUEST_EMAIL_DOMAIN}`;
}

export function isGuestEmail(email?: string | null) {
  return !!email && email.endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}
