import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getAllSwaps, adminApproveSwap, cancelSwap, subscribeToSwaps } from '../../lib/swaps';
import { Avatar } from '../Avatar';
import type { SwapRequest } from '../../types/swap';

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  matched: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  expired: 'bg-gray-100 text-gray-400',
};

export function SwapManagement() {
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const load = () => {
    getAllSwaps().then((data) => {
      setSwaps(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    return subscribeToSwaps(load);
  }, []);

  const displayed = filter === 'active'
    ? swaps.filter((s) => s.status === 'open' || s.status === 'matched')
    : swaps;

  const act = async (swapId: string, fn: () => Promise<void>) => {
    setBusy(swapId);
    try {
      await fn();
      load();
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['active', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'active' ? 'Active' : 'All'}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-12">
          <ArrowLeftRight className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            {filter === 'active' ? 'No active swap requests.' : 'No swap requests yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((sr) => (
            <SwapRow
              key={sr.id}
              swap={sr}
              isBusy={busy === sr.id}
              onApprove={() => act(sr.id, () => adminApproveSwap(sr.id))}
              onCancel={() => act(sr.id, () => cancelSwap(sr.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SwapRow({
  swap,
  isBusy,
  onApprove,
  onCancel,
}: {
  swap: SwapRequest;
  isBusy: boolean;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const requesterName = `${swap.requester.first_name} ${swap.requester.last_name}`;
  const responderName = swap.responder
    ? `${swap.responder.first_name} ${swap.responder.last_name}`
    : null;

  const shiftDate = (swap.shift as any)?.date
    ? format(parseISO((swap.shift as any).date), 'EEE, MMM d')
    : '—';
  const shiftType = (swap.shift as any)?.type === 'early' ? 'Early' : 'Late';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar
            url={swap.requester.avatar_url}
            name={requesterName}
            size="sm"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{requesterName}</p>
            <p className="text-xs text-gray-500">
              {shiftDate} · {shiftType} shift
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[swap.status] ?? ''}`}>
          {swap.status}
        </span>
      </div>

      {swap.reason && (
        <p className="text-sm text-gray-600 italic">"{swap.reason}"</p>
      )}

      {responderName && (
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Avatar
            url={swap.responder?.avatar_url}
            name={responderName}
            size="sm"
          />
          <span>Covered by: <strong>{responderName}</strong></span>
        </div>
      )}

      {(swap.status === 'open' || swap.status === 'matched') && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isBusy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Force approve
          </button>
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
