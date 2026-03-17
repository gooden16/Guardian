export type SwapStatus = 'open' | 'matched' | 'confirmed' | 'cancelled' | 'expired';

export interface SwapRequest {
  id: string;
  requester_id: string;
  shift_id: string;
  offered_shift_id?: string | null;
  reason: string;
  status: SwapStatus;
  responder_id?: string | null;
  expires_at: string;
  created_at: string;
  requester?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: string;
  };
  responder?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  } | null;
  shift?: {
    date: string;
    type: 'early' | 'late';
    event_title?: string;
    hebrew_parasha?: string;
  };
}
