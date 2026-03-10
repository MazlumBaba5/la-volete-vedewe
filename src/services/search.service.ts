import { createAdminClient } from '@/lib/supabase/server';
import type { Advisor, SearchFilters, SearchResult } from '@/types';

/**
 * Search Service - Business logic for search and filtering operations
 * Prioritizes Diamond and Premium subscription levels
 */

export async function searchAdvisors(filters: SearchFilters): Promise<SearchResult> {
  try {
    const supabase = createAdminClient();
    const {
      query,
      category,
      minPrice,
      maxPrice,
      subscriptionLevel,
      verified,
      sortBy = 'relevance',
      page = 1,
      limit = 10,
    } = filters;

    let query_builder = supabase.from('advisors').select('*', { count: 'exact' });

    // Apply filters
    if (query) {
      query_builder = query_builder.or(
        `name.ilike.%${query}%,headline.ilike.%${query}%,description.ilike.%${query}%`,
      );
    }

    if (subscriptionLevel) {
      query_builder = query_builder.eq('subscriptionLevel', subscriptionLevel);
    }

    if (verified !== undefined) {
      query_builder = query_builder.eq('isVerified', verified);
    }

    // Prioritize Diamond and Premium
    const orderBy = sortBy === 'relevance' ? 'subscriptionLevel' : sortBy;
    query_builder = query_builder.order(orderBy, {
      ascending: sortBy === 'relevance',
    });

    // Pagination
    const offset = (page - 1) * limit;
    const { data, count, error } = await query_builder.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      profiles: (data as unknown as import('@/types').Profile[]) || [],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error searching advisors:', error);
    throw error;
  }
}
