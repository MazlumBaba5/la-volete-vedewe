import { revalidateTag } from 'next/cache'

const BASE_MARKETPLACE_TAGS = [
  'marketplace:profiles',
  'marketplace:featured',
  'marketplace:recent',
  'marketplace:cities',
  'marketplace:stats',
  'marketplace:categories',
] as const

export function invalidateMarketplaceCache(extraTags: string[] = []) {
  const tags = [...BASE_MARKETPLACE_TAGS, ...extraTags]
  for (const tag of tags) {
    revalidateTag(tag)
  }
}

