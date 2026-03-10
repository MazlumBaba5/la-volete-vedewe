import { createAdminClient } from '@/lib/supabase/server';
import type { Subscription } from '@/types';

/**
 * Subscription Service - Business logic for subscription operations
 */

export async function getActiveSubscription(advisorId: string): Promise<Subscription | null> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('advisorId', advisorId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data as Subscription | null;
  } catch (error) {
    console.error('Error fetching active subscription:', error);
    throw error;
  }
}

export async function createSubscription(
  subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Subscription> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) throw error;
    return data as Subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}
