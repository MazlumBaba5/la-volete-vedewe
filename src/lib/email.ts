type VerificationEmailInput = {
  advisorName: string
  city: string
  slug: string
  submittedAt: string
}

type PaidPlanActivationEmailInput = {
  to: string
  displayName?: string | null
  planLabel: string
  dashboardPath: string
  currentPeriodEnd?: string | null
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function formatUtcDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
}

function sanitizeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendVerificationNotificationEmail(input: VerificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const to = process.env.LVVD_NOTIFICATION_EMAIL || 'lvvd_nl@hotmail.com'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is missing, skipping verification notification')
    return
  }

  const adminUrl = `${getBaseUrl()}/admin`
  const profileUrl = `${getBaseUrl()}/profile/${input.slug}`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New advisor verification request: ${input.advisorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin-bottom: 16px;">New advisor verification request</h2>
          <p><strong>Advisor:</strong> ${input.advisorName}</p>
          <p><strong>City:</strong> ${input.city}</p>
          <p><strong>Submitted at:</strong> ${input.submittedAt}</p>
          <p style="margin-top: 24px;">
            <a href="${adminUrl}" style="display: inline-block; padding: 10px 16px; background: #e91e8c; color: white; text-decoration: none; border-radius: 8px;">
              Open admin panel
            </a>
          </p>
          <p style="margin-top: 12px;">
            <a href="${profileUrl}">View public profile</a>
          </p>
        </div>
      `,
      text: [
        'New advisor verification request',
        `Advisor: ${input.advisorName}`,
        `City: ${input.city}`,
        `Submitted at: ${input.submittedAt}`,
        `Admin panel: ${adminUrl}`,
        `Profile: ${profileUrl}`,
      ].join('\n'),
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Resend error: ${message}`)
  }
}

export async function sendPaidPlanActivationEmail(input: PaidPlanActivationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is missing, skipping paid plan activation notification')
    return
  }

  const to = input.to.trim().toLowerCase()
  if (!to) {
    return
  }

  const dashboardPath = input.dashboardPath.startsWith('/')
    ? input.dashboardPath
    : `/${input.dashboardPath}`
  const dashboardUrl = `${getBaseUrl()}${dashboardPath}`
  const displayName = (input.displayName?.trim() || 'there').slice(0, 120)
  const safeDisplayName = sanitizeHtml(displayName)
  const safePlanLabel = sanitizeHtml(input.planLabel)
  const safePeriodEnd = input.currentPeriodEnd ? sanitizeHtml(formatUtcDate(input.currentPeriodEnd)) : null

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Your ${input.planLabel} plan is now active`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2 style="margin-bottom: 16px;">Payment confirmed</h2>
          <p>Hi ${safeDisplayName},</p>
          <p>Your payment was successful and your <strong>${safePlanLabel}</strong> plan is now active.</p>
          ${safePeriodEnd ? `<p><strong>Access valid until:</strong> ${safePeriodEnd} (UTC)</p>` : ''}
          <p style="margin-top: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 10px 16px; background: #e91e8c; color: white; text-decoration: none; border-radius: 8px;">
              Open dashboard
            </a>
          </p>
          <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
            If you did not authorize this payment, please contact support immediately.
          </p>
        </div>
      `,
      text: [
        'Payment confirmed',
        `Hi ${displayName},`,
        `Your payment was successful and your ${input.planLabel} plan is now active.`,
        safePeriodEnd ? `Access valid until: ${formatUtcDate(input.currentPeriodEnd as string)} (UTC)` : null,
        `Dashboard: ${dashboardUrl}`,
      ].filter(Boolean).join('\n'),
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Resend error: ${message}`)
  }
}
