import { createClient } from '@/lib/supabase/server';
import type { Advisor } from '@/types';

/**
 * Advisor Service - Business logic for advisor operations
 */

export async function getAdvisorById(id: string): Promise<Advisor | null> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Advisor;
  } catch (error) {
    console.error('Error fetching advisor:', error);
    throw error;
  }
}

export async function getAdvisorsBySubscriptionLevel(
  level: 'premium' | 'diamond',
): Promise<Advisor[]> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('advisors')
      .select('*')
      .eq('subscriptionLevel', level)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Advisor[];
  } catch (error) {
    console.error('Error fetching advisors by subscription level:', error);
    throw error;
  }
}

export async function updateAdvisor(id: string, updates: Partial<Advisor>): Promise<Advisor> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('advisors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Advisor;
  } catch (error) {
    console.error('Error updating advisor:', error);
    throw error;
  }
}
