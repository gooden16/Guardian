import { supabase } from './supabase';
import type { SwapRequest } from '../types/swap';

const SWAP_SELECT = `
  id, requester_id, shift_id, offered_shift_id, reason, status,
  responder_id, expires_at, created_at,
  requester:profiles!requester_id (
    id, first_name, last_name, avatar_url, role
  ),
  responder:profiles!responder_id (
    id, first_name, last_name, avatar_url, role
  ),
  shift:shifts!shift_id (
    id, date, type, event_title, quarter_id
  ),
  offered_shift:shifts!offered_shift_id (
    id, date, type, event_title, quarter_id
  )
`;

/** All open swap requests the current user could fulfil (same role tier, eligible) */
export async function getOpenSwaps(quarterId: string): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .eq('status', 'open')
    // join through shifts to filter by quarter
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Filter to requests where shift belongs to this quarter
  return ((data ?? []) as unknown as SwapRequest[]).filter(
    (sr) => (sr.shift as any)?.quarter_id === quarterId
  );
}

export async function getMySwaps(userId: string): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .or(`requester_id.eq.${userId},responder_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SwapRequest[];
}

export async function getAllSwaps(): Promise<SwapRequest[]> {
  const { data, error } = await supabase
    .from('swap_requests')
    .select(SWAP_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as SwapRequest[];
}

export async function requestSwap(params: {
  requesterId: string;
  shiftId: string;
  offeredShiftId?: string;
  reason: string;
  expiresAt: string;
}): Promise<SwapRequest> {
  const { data, error } = await supabase
    .from('swap_requests')
    .insert({
      requester_id: params.requesterId,
      shift_id: params.shiftId,
      offered_shift_id: params.offeredShiftId ?? null,
      reason: params.reason,
      status: 'open',
      expires_at: params.expiresAt,
    })
    .select(SWAP_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as SwapRequest;
}

/** Volunteer offers to respond to an open swap */
export async function respondToSwap(
  swapId: string,
  responderId: string
): Promise<SwapRequest> {
  const { data, error } = await supabase
    .from('swap_requests')
    .update({ responder_id: responderId, status: 'matched' })
    .eq('id', swapId)
    .select(SWAP_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as SwapRequest;
}

/**
 * Called when both parties confirm. Executes the assignment swap in shift_volunteers,
 * then marks the request confirmed.
 */
export async function confirmSwap(swapId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_swap', { p_swap_id: swapId });
  if (error) throw error;
}

export async function cancelSwap(swapId: string): Promise<void> {
  const { error } = await supabase
    .from('swap_requests')
    .update({ status: 'cancelled' })
    .eq('id', swapId);

  if (error) throw error;
}

/** Admin override: force-approve a swap without dual confirmation */
export async function adminApproveSwap(swapId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_swap', { p_swap_id: swapId });
  if (error) throw error;
}

export function subscribeToSwaps(onUpdate: () => void) {
  const channel = supabase
    .channel('swap_requests:all')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'swap_requests' },
      () => onUpdate()
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
