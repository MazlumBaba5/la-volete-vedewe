export type SubscriptionPlanKey = 'premium' | 'diamond'
export type CreditPackKey = 'starter' | 'boost' | 'power'

type SubscriptionPlan = {
  key: SubscriptionPlanKey
  name: string
  priceLabel: string
  intervalLabel: string
  priceId: string | undefined
}

type CreditPack = {
  key: CreditPackKey
  name: string
  credits: number
  priceLabel: string
  priceId: string | undefined
  description: string
}

export const subscriptionPlans: Record<SubscriptionPlanKey, SubscriptionPlan> = {
  premium: {
    key: 'premium',
    name: 'Premium',
    priceLabel: 'EUR 29',
    intervalLabel: '/ mo',
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  },
  diamond: {
    key: 'diamond',
    name: 'Diamond',
    priceLabel: 'EUR 59',
    intervalLabel: '/ mo',
    priceId: process.env.STRIPE_PRICE_DIAMOND_MONTHLY,
  },
}

export const creditPacks: Record<CreditPackKey, CreditPack> = {
  starter: {
    key: 'starter',
    name: 'Starter Pack',
    credits: 10,
    priceLabel: 'EUR 15',
    priceId: process.env.STRIPE_PRICE_CREDITS_STARTER,
    description: 'A small boost for featured actions and visibility tests.',
  },
  boost: {
    key: 'boost',
    name: 'Boost Pack',
    credits: 25,
    priceLabel: 'EUR 35',
    priceId: process.env.STRIPE_PRICE_CREDITS_BOOST,
    description: 'Balanced pack for recurring visibility boosts.',
  },
  power: {
    key: 'power',
    name: 'Power Pack',
    credits: 60,
    priceLabel: 'EUR 75',
    priceId: process.env.STRIPE_PRICE_CREDITS_POWER,
    description: 'Best value for accounts relying on credits every week.',
  },
}

export function getSubscriptionPlan(plan: string) {
  if (plan !== 'premium' && plan !== 'diamond') {
    throw new Error(`Unsupported subscription plan: ${plan}`)
  }

  const config = subscriptionPlans[plan]
  if (!config.priceId) {
    throw new Error(`Missing Stripe price id for plan "${plan}"`)
  }

  return config
}

export function getCreditPack(pack: string) {
  if (pack !== 'starter' && pack !== 'boost' && pack !== 'power') {
    throw new Error(`Unsupported credit pack: ${pack}`)
  }

  const config = creditPacks[pack]
  if (!config.priceId) {
    throw new Error(`Missing Stripe price id for credit pack "${pack}"`)
  }

  return config
}
