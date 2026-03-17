import { supabase } from './supabase';
import type { Quarter, QuarterStatus } from '../types/quarter';

export async function getCurrentQuarter(): Promise<Quarter | null> {
  const today = new Date().toISOString().split('T')[0];
  // Return the most recent non-closed quarter whose end_date hasn't passed yet
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .gte('end_date', today)
    .not('status', 'eq', 'closed')
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching current quarter:', error);
    return null;
  }
  return data;
}

export async function getQuarters(): Promise<Quarter[]> {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getQuarter(id: string): Promise<Quarter | null> {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function createQuarter(params: {
  name: string;
  start_date: string;
  end_date: string;
}): Promise<Quarter> {
  const { data, error } = await supabase
    .from('quarters')
    .insert({ ...params, status: 'setup' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function advanceQuarterStatus(
  quarterId: string,
  newStatus: QuarterStatus
): Promise<void> {
  const { error } = await supabase
    .from('quarters')
    .update({ status: newStatus })
    .eq('id', quarterId);

  if (error) throw error;
}

export async function updateQuarterDeadline(
  quarterId: string,
  swapDeadlineHours: number
): Promise<void> {
  const { error } = await supabase
    .from('quarters')
    .update({ swap_deadline_hours: swapDeadlineHours })
    .eq('id', quarterId);

  if (error) throw error;
}
