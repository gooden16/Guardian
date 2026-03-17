import { supabase } from './supabase';
import type { Announcement } from '../types/announcement';

export async function getAnnouncements(shiftId?: string): Promise<Announcement[]> {
  let query = supabase
    .from('announcements')
    .select(`
      id, body, created_at, shift_id,
      author:profiles!author_id (
        id, first_name, last_name, avatar_url, role
      )
    `)
    .order('created_at', { ascending: false });

  if (shiftId !== undefined) {
    // shift-specific messages for this shift
    query = query.eq('shift_id', shiftId);
  } else {
    // broadcast only (null shift_id)
    query = query.is('shift_id', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Announcement[];
}

export async function postAnnouncement(
  authorId: string,
  body: string,
  shiftId?: string
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      author_id: authorId,
      body,
      shift_id: shiftId ?? null,
    })
    .select(`
      id, body, created_at, shift_id,
      author:profiles!author_id (
        id, first_name, last_name, avatar_url, role
      )
    `)
    .single();

  if (error) throw error;
  return data as unknown as Announcement;
}

export function subscribeToAnnouncements(
  onInsert: (a: Announcement) => void,
  shiftId?: string
) {
  const filter = shiftId
    ? `shift_id=eq.${shiftId}`
    : 'shift_id=is.null';

  const channel = supabase
    .channel(`announcements:${shiftId ?? 'broadcast'}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'announcements', filter },
      async (payload) => {
        // Fetch the full row with author join since realtime payload lacks joins
        const { data } = await supabase
          .from('announcements')
          .select(`
            id, body, created_at, shift_id,
            author:profiles!author_id (
              id, first_name, last_name, avatar_url, role
            )
          `)
          .eq('id', payload.new.id)
          .single();
        if (data) onInsert(data as unknown as Announcement);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
