/**
 * send-notifications Edge Function
 *
 * Triggered by a Supabase DB Webhook on `notification_queue` INSERT
 * (or called on a schedule via pg_cron every 5 minutes as a fallback).
 *
 * Reads unprocessed rows, sends via Resend API, marks sent_at.
 *
 * Deploy: supabase functions deploy send-notifications
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_ADDRESS = Deno.env.get('NOTIFICATION_FROM') ?? 'noreply@cssguardian.org';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface NotificationRow {
  id: string;
  user_id: string;
  notification_type: 'assignment' | 'change' | 'announcement' | 'swap_open' | 'swap_matched' | 'swap_confirmed' | 'swap_expired';
  payload: Record<string, unknown>;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function buildSubjectAndHtml(row: NotificationRow, recipientName: string): { subject: string; html: string } {
  const p = row.payload;

  switch (row.notification_type) {
    case 'assignment':
      return {
        subject: `You've been scheduled: ${p.event_title}`,
        html: `
          <p>Hi ${recipientName},</p>
          <p>You've been assigned to <strong>${p.event_title}</strong> on <strong>${p.date}</strong> (${p.shift_type} shift).</p>
          <p>Log in to CSS Guardian to view your full schedule.</p>
        `,
      };
    case 'change':
      return {
        subject: `Schedule change: ${p.event_title}`,
        html: `
          <p>Hi ${recipientName},</p>
          <p>Your assignment for <strong>${p.event_title}</strong> on <strong>${p.date}</strong> has been updated.</p>
          <p>Log in to CSS Guardian to view the latest schedule.</p>
        `,
      };
    case 'announcement':
      return {
        subject: `New announcement from ${p.author_name}`,
        html: `
          <p>Hi ${recipientName},</p>
          <p><strong>${p.author_name}</strong> posted a new announcement:</p>
          <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 12px; color: #374151;">
            ${p.body}
          </blockquote>
          <p>Log in to CSS Guardian to reply.</p>
        `,
      };
    case 'swap_open':
      return {
        subject: `${p.requester_name} needs a shift swap`,
        html: `
          <p>Hi ${recipientName},</p>
          <p><strong>${p.requester_name}</strong> is looking for someone to cover their shift on <strong>${p.date}</strong> (${p.shift_type}).</p>
          <p>Reason: <em>${p.reason}</em></p>
          <p>Log in to CSS Guardian to offer coverage.</p>
        `,
      };
    case 'swap_matched':
      return {
        subject: 'Someone offered to cover your shift!',
        html: `
          <p>Hi ${recipientName},</p>
          <p><strong>${p.responder_name}</strong> has offered to cover your shift on <strong>${p.date}</strong> (${p.shift_type}).</p>
          <p>Log in to CSS Guardian to confirm the swap.</p>
        `,
      };
    case 'swap_confirmed':
      return {
        subject: `Shift swap confirmed for ${p.date}`,
        html: `
          <p>Hi ${recipientName},</p>
          <p>Your shift swap for <strong>${p.date}</strong> (${p.shift_type}) has been confirmed.</p>
          <p>Log in to CSS Guardian to view your updated schedule.</p>
        `,
      };
    case 'swap_expired':
      return {
        subject: `Swap request expired: ${p.date}`,
        html: `
          <p>Hi ${recipientName},</p>
          <p>Your swap request for <strong>${p.date}</strong> (${p.shift_type}) has expired — no one was able to cover it in time.</p>
          <p>You remain assigned to this shift. Contact your admin if you have concerns.</p>
        `,
      };
    default:
      return {
        subject: 'CSS Guardian notification',
        html: `<p>Hi ${recipientName}, you have a new notification. Log in to CSS Guardian for details.</p>`,
      };
  }
}

Deno.serve(async (_req) => {
  try {
    // Fetch unsent notifications (no sent_at, no error)
    const { data: rows, error: fetchError } = await supabase
      .from('notification_queue')
      .select('id, user_id, notification_type, payload')
      .is('sent_at', null)
      .is('error', null)
      .limit(50);

    if (fetchError) throw fetchError;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all profiles needed in one query
    const userIds = [...new Set(rows.map((r: NotificationRow) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email:auth_users(email)')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p: any) => [p.id, p])
    );

    let processed = 0;
    let failed = 0;

    for (const row of rows as NotificationRow[]) {
      const profile = profileMap.get(row.user_id);
      if (!profile) {
        await supabase
          .from('notification_queue')
          .update({ error: 'Profile not found', sent_at: new Date().toISOString() })
          .eq('id', row.id);
        failed++;
        continue;
      }

      const recipientEmail = (profile as any).email?.[0]?.email;
      if (!recipientEmail) {
        await supabase
          .from('notification_queue')
          .update({ error: 'No email on file', sent_at: new Date().toISOString() })
          .eq('id', row.id);
        failed++;
        continue;
      }

      const recipientName = `${profile.first_name} ${profile.last_name}`;

      try {
        const { subject, html } = buildSubjectAndHtml(row, recipientName);
        await sendEmail(recipientEmail, subject, html);
        await supabase
          .from('notification_queue')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', row.id);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from('notification_queue')
          .update({ error: msg })
          .eq('id', row.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
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
