import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { respondToSwap, confirmSwap, cancelSwap } from '../lib/swaps';
import { Avatar } from './Avatar';
import type { SwapRequest } from '../types/swap';

interface SwapFeedCardProps {
  swap: SwapRequest;
  currentUserId: string;
  onAction: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'text-amber-600 bg-amber-50' },
  matched: { label: 'Awaiting confirmation', color: 'text-blue-600 bg-blue-50' },
  confirmed: { label: 'Confirmed', color: 'text-green-600 bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-50' },
  expired: { label: 'Expired', color: 'text-gray-400 bg-gray-50' },
};

export function SwapFeedCard({ swap, currentUserId, onAction }: SwapFeedCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isRequester = swap.requester_id === currentUserId;
  const isResponder = swap.responder_id === currentUserId;

  const requesterName = `${swap.requester.first_name} ${swap.requester.last_name}`;
  const shiftDate = (swap.shift as any)?.date
    ? format(parseISO((swap.shift as any).date), 'EEE, MMM d')
    : 'Unknown date';
  const shiftLabel = (swap.shift as any)?.type === 'early' ? 'Early shift' : 'Late shift';
  const eventTitle = (swap.shift as any)?.event_title ?? '';

  const statusInfo = STATUS_LABELS[swap.status] ?? STATUS_LABELS.open;

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar
            url={swap.requester.avatar_url}
            name={requesterName}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isRequester ? 'You' : requesterName}
            </p>
            <p className="text-xs text-gray-500">
              {shiftDate} · {shiftLabel}
              {eventTitle && ` · ${eventTitle}`}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Reason */}
      {swap.reason && (
        <p className="text-sm text-gray-700 italic">"{swap.reason}"</p>
      )}

      {/* Offered shift */}
      {(swap.offered_shift as any)?.date && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <ArrowLeftRight className="h-3.5 w-3.5" />
          <span>
            Offering {format(parseISO((swap.offered_shift as any).date), 'MMM d')} ·{' '}
            {(swap.offered_shift as any).type === 'early' ? 'Early' : 'Late'} shift
          </span>
        </div>
      )}

      {/* Responder info when matched/confirmed */}
      {swap.responder && (swap.status === 'matched' || swap.status === 'confirmed') && (
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
          <Avatar
            url={swap.responder.avatar_url}
            name={`${swap.responder.first_name} ${swap.responder.last_name}`}
            size="sm"
          />
          <span>
            {isResponder ? 'You offered' : `${swap.responder.first_name} offered`} to cover this shift
          </span>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2">
        {/* Open swap — non-requester can offer to take it */}
        {swap.status === 'open' && !isRequester && (
          <button
            onClick={() => act(() => respondToSwap(swap.id, currentUserId))}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            I'll cover this
          </button>
        )}

        {/* Requester can cancel their own open request */}
        {swap.status === 'open' && isRequester && (
          <button
            onClick={() => act(() => cancelSwap(swap.id))}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel request
          </button>
        )}

        {/* Matched — both sides need to confirm */}
        {swap.status === 'matched' && (isRequester || isResponder) && (
          <>
            <button
              onClick={() => act(() => confirmSwap(swap.id))}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm swap
            </button>
            <button
              onClick={() => act(() => cancelSwap(swap.id))}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Decline
            </button>
          </>
        )}

        {/* Expiry notice */}
        {swap.status === 'open' && swap.expires_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Clock className="h-3.5 w-3.5" />
            <span>Expires {format(parseISO(swap.expires_at), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
