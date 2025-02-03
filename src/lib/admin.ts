import { supabase } from './supabase';

export async function syncParashaData(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .rpc('sync_parasha_data', {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });

  if (error) throw error;
  return data;
}
