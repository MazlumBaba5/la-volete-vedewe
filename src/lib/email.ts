type VerificationEmailInput = {
  advisorName: string
  city: string
  slug: string
  submittedAt: string
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
