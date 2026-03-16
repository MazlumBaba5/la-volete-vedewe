import crypto from 'node:crypto'

export const ADMIN_SESSION_COOKIE = 'lvvd_admin_session'

type SignedPayload = {
  exp: number
  [key: string]: unknown
}

type AdminCredentials = {
  username: string
  password: string
}

function getRequiredEnv(name: 'LVVD_ADMIN_SESSION_SECRET' | 'LVVD_ADMIN_USERNAME' | 'LVVD_ADMIN_PASSWORD') {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function getSecret() {
  return getRequiredEnv('LVVD_ADMIN_SESSION_SECRET')
}

export function isAdminAuthConfigured() {
  return Boolean(
    getRequiredEnv('LVVD_ADMIN_SESSION_SECRET') &&
    getRequiredEnv('LVVD_ADMIN_USERNAME') &&
    getRequiredEnv('LVVD_ADMIN_PASSWORD')
  )
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string) {
  const secret = getSecret()
  if (!secret) return null
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

function signPayload(payload: SignedPayload) {
  const encoded = toBase64Url(JSON.stringify(payload))
  const signature = signValue(encoded)
  if (!signature) return null
  return `${encoded}.${signature}`
}

function verifySignedPayload(token?: string | null): SignedPayload | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = signValue(encoded)
  if (!expected) return null
  if (signature.length !== expected.length) return null
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) return null

  try {
    const payload = JSON.parse(fromBase64Url(encoded)) as SignedPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function createCaptchaChallenge() {
  if (!getSecret()) return null
  const left = Math.floor(Math.random() * 7) + 2
  const right = Math.floor(Math.random() * 8) + 1
  const token = signPayload({
    answer: String(left + right),
    exp: Date.now() + 10 * 60 * 1000,
  })
  if (!token) return null
  return {
    question: `${left} + ${right} = ?`,
    token,
  }
}

export function verifyCaptchaChallenge(token: string, answer: string) {
  const payload = verifySignedPayload(token)
  if (!payload) return false
  return String(payload.answer) === answer.trim()
}

export function getAdminCredentials(): AdminCredentials | null {
  const username = getRequiredEnv('LVVD_ADMIN_USERNAME')
  const password = getRequiredEnv('LVVD_ADMIN_PASSWORD')
  if (!username || !password) return null
  return { username, password }
}

export function createAdminSession(username: string) {
  return signPayload({
    username,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  })
}

export function verifyAdminSession(token?: string | null) {
  return verifySignedPayload(token)
}
