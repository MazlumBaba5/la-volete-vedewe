import crypto from 'node:crypto'

export const ADMIN_SESSION_COOKIE = 'lvvd_admin_session'

type SignedPayload = {
  exp: number
  [key: string]: unknown
}

function getSecret() {
  return process.env.LVVD_ADMIN_SESSION_SECRET || 'lvvd-admin-dev-secret'
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url')
}

function signPayload(payload: SignedPayload) {
  const encoded = toBase64Url(JSON.stringify(payload))
  return `${encoded}.${signValue(encoded)}`
}

function verifySignedPayload(token?: string | null): SignedPayload | null {
  if (!token) return null
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null

  const expected = signValue(encoded)
  if (signature.length !== expected.length) return null
  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  if (!valid) return null

  const payload = JSON.parse(fromBase64Url(encoded)) as SignedPayload
  if (payload.exp < Date.now()) return null
  return payload
}

export function createCaptchaChallenge() {
  const left = Math.floor(Math.random() * 7) + 2
  const right = Math.floor(Math.random() * 8) + 1
  return {
    question: `${left} + ${right} = ?`,
    token: signPayload({
      answer: String(left + right),
      exp: Date.now() + 10 * 60 * 1000,
    }),
  }
}

export function verifyCaptchaChallenge(token: string, answer: string) {
  const payload = verifySignedPayload(token)
  if (!payload) return false
  return String(payload.answer) === answer.trim()
}

export function getAdminCredentials() {
  return {
    username: process.env.LVVD_ADMIN_USERNAME || 'lvvdadmin',
    password: process.env.LVVD_ADMIN_PASSWORD || 'lvvdteam2026',
  }
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
