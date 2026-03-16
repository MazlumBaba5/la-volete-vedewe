const BLOCKED_EMAIL_DOMAINS = [
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemail.net',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mailpoof.com',
  'mail-temporaire.fr',
  'mail2tor.com',
  'moakt.com',
  'mytemp.email',
  'sharklasers.com',
  'spambox.us',
  'temp-mail.org',
  'tempmail.com',
  'tempmail.dev',
  'tempmail.ninja',
  'tempmailo.com',
  'tempinbox.com',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.de',
  'trashmail.org',
  'trashmail.ws',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yopmail.org',
] as const

const BLOCKED_DOMAIN_KEYWORDS = [
  '10minutemail',
  'dispostable',
  'fakeinbox',
  'fakemail',
  'guerrillamail',
  'mailinator',
  'maildrop',
  'mail2tor',
  'sharklasers',
  'tempmail',
  'throwawaymail',
  'trashmail',
  'yopmail',
] as const

const BLOCKED_DOMAINS = new Set(BLOCKED_EMAIL_DOMAINS)

export function normalizeEmailAddress(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

export function extractEmailDomain(email: string) {
  const normalizedEmail = normalizeEmailAddress(email)
  const atIndex = normalizedEmail.lastIndexOf('@')
  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) return null

  const domain = normalizedEmail.slice(atIndex + 1).trim().replace(/\.+$/, '')
  if (!domain || domain.includes(' ') || !domain.includes('.')) return null
  return domain
}

function matchesBlockedDomain(domain: string, blockedDomain: string) {
  return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
}

export function isBlockedEmailDomain(domain: string) {
  const normalizedDomain = domain.trim().toLowerCase().replace(/\.+$/, '')
  if (!normalizedDomain) return false

  if (normalizedDomain.endsWith('.onion')) return true

  for (const blockedDomain of BLOCKED_DOMAINS) {
    if (matchesBlockedDomain(normalizedDomain, blockedDomain)) {
      return true
    }
  }

  return BLOCKED_DOMAIN_KEYWORDS.some((keyword) => normalizedDomain.includes(keyword))
}

export function getBlockedEmailRegistrationError(email: string) {
  const domain = extractEmailDomain(email)
  if (!domain) return null

  if (!isBlockedEmailDomain(domain)) return null

  return 'Temporary or anonymous email providers are not allowed. Please use a trusted email provider.'
}
