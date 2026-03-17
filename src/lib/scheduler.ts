import { supabase } from './supabase';

export interface SchedulerRun {
  id: string;
  quarter_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result_summary?: {
    assigned: number;
    warnings: string[];
    tl_gaps: number;
    understaffed_shifts: number;
  };
  created_at: string;
  completed_at?: string;
}

/** Invoke the run-scheduler Edge Function */
export async function runScheduler(quarterId: string): Promise<{ run_id: string; summary: SchedulerRun['result_summary'] }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/run-scheduler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ quarter_id: quarterId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'Scheduler failed');
  }

  return res.json();
}

/** Get the most recent scheduler run for a quarter */
export async function getLastRun(quarterId: string): Promise<SchedulerRun | null> {
  const { data, error } = await supabase
    .from('scheduler_runs')
    .select('*')
    .eq('quarter_id', quarterId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

/** Publish the schedule: mark all shifts as published + advance quarter to active */
export async function publishSchedule(quarterId: string): Promise<void> {
  // 1. Publish all shifts
  const { error: shiftErr } = await supabase
    .from('shifts')
    .update({ status: 'published' })
    .eq('quarter_id', quarterId);

  if (shiftErr) throw shiftErr;

  // 2. Advance quarter to active
  const { error: qErr } = await supabase
    .from('quarters')
    .update({ status: 'active' })
    .eq('id', quarterId);

  if (qErr) throw qErr;

  // 3. Populate notification_queue for all assigned volunteers
  // (The DB trigger on shift_assignments handles individual inserts;
  //  here we do a bulk insert for the "assignment published" notification)
  const { data: assignments } = await supabase
    .from('shift_assignments')
    .select('user_id, shift_id, profiles!inner(notification_assignments)')
    .in(
      'shift_id',
      await supabase
        .from('shifts')
        .select('id')
        .eq('quarter_id', quarterId)
        .then(({ data }) => (data ?? []).map((s) => s.id))
    );

  if (assignments && assignments.length > 0) {
    const notifications = assignments
      .filter((a: any) => a.profiles?.notification_assignments !== false)
      .map((a: any) => ({
        user_id: a.user_id,
        notification_type: 'assignment',
        payload: { shift_id: a.shift_id, quarter_id: quarterId },
      }));

    if (notifications.length > 0) {
      await supabase.from('notification_queue').insert(notifications);
    }
  }
}
