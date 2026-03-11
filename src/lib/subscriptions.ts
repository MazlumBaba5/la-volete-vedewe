type SubscriptionWindow = {
  status?: string | null
  current_period_end?: string | null
}

export function isSubscriptionCurrentlyActive(subscription: SubscriptionWindow | null | undefined) {
  if (!subscription || subscription.status !== 'active') {
    return false
  }

  if (!subscription.current_period_end) {
    return true
  }

  return new Date(subscription.current_period_end).getTime() > Date.now()
}

export function addOneMonthPreservingCalendar(date: Date) {
  const result = new Date(date)
  const dayOfMonth = result.getUTCDate()

  result.setUTCMonth(result.getUTCMonth() + 1)

  if (result.getUTCDate() !== dayOfMonth) {
    result.setUTCDate(0)
  }

  return result
}
