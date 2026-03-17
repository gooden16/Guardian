/**
 * expire-swaps Edge Function
 *
 * Run on a schedule (e.g. pg_cron every hour) to expire stale swap requests.
 *
 * For each swap_request where:
 *   - status IN ('open', 'matched')
 *   - expires_at < now()
 *
 * Sets status = 'expired' and inserts a notification_queue row for the requester.
 *
 * Deploy: supabase functions deploy expire-swaps
 * Schedule: SELECT cron.schedule('expire-swaps', '0 * * * *', $$SELECT net.http_post(...)$$);
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (_req) => {
  try {
    // Find expired swap requests
    const { data: expired, error: fetchError } = await supabase
      .from('swap_requests')
      .select(`
        id, requester_id, shift_id,
        shift:shifts!shift_id (date, type, event_title)
      `)
      .in('status', ['open', 'matched'])
      .lt('expires_at', new Date().toISOString());

    if (fetchError) throw fetchError;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const swapIds = expired.map((s: any) => s.id);

    // Mark as expired
    const { error: updateError } = await supabase
      .from('swap_requests')
      .update({ status: 'expired' })
      .in('id', swapIds);

    if (updateError) throw updateError;

    // Queue expiry notifications for requesters
    const notifications = expired.map((s: any) => ({
      user_id: s.requester_id,
      notification_type: 'swap_expired',
      payload: {
        swap_id: s.id,
        date: s.shift?.date ?? '',
        shift_type: s.shift?.type ?? '',
        event_title: s.shift?.event_title ?? '',
      },
    }));

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notification_queue')
        .insert(notifications);
      if (notifError) console.error('Failed to queue expiry notifications:', notifError);
    }

    return new Response(JSON.stringify({ expired: expired.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
