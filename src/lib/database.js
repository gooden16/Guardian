import { supabase } from './supabase';

// Shifts
export async function getUpcomingShifts() {
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      assignments:shift_assignments(
        volunteer:profiles(id, name, email, avatar_url, training_level),
        role
      )
    `)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getShiftById(id) {
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      assignments:shift_assignments(
        volunteer:profiles(id, name, email, avatar_url, training_level),
        role
      ),
      notes
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function signUpForShift(shiftId, role) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shift_assignments')
    .insert({
      shift_id: shiftId,
      volunteer_id: user.id,
      role
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Conversations
export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        volunteer:profiles(id, name, avatar_url)
      ),
      messages(
        id,
        text,
        created_at,
        sender:profiles(id, name, avatar_url)
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function sendMessage(conversationId, text) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      text
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Volunteers
export async function getVolunteers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      shifts:shift_assignments(
        shift:shifts(*)
      )
    `)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

// Real-time subscriptions
export function subscribeToConversation(conversationId, onMessage) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();
}

export function subscribeToShifts(onUpdate) {
  return supabase
    .channel('shifts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shifts'
      },
      (payload) => onUpdate(payload)
    )
    .subscribe();
}