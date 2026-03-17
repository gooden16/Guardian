import React, { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { isBefore, parseISO, subHours } from 'date-fns';
import { getMySwaps, requestSwap } from '../lib/swaps';
import { SwapRequestForm } from './SwapRequestForm';
import type { Shift } from '../types/shift';

interface SwapRequestButtonProps {
  shift: Shift;
  currentUserId: string;
  /** quarter swap_deadline_hours — default 48 */
  deadlineHours?: number;
}

export function SwapRequestButton({
  shift,
  currentUserId,
  deadlineHours = 48,
}: SwapRequestButtonProps) {
  const [hasOpenSwap, setHasOpenSwap] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine if swap window is still open
  const shiftStart = parseISO(`${shift.date}T08:35:00`); // early default; good enough for deadline check
  const deadline = subHours(shiftStart, deadlineHours);
  const isPastDeadline = isBefore(deadline, new Date());

  useEffect(() => {
    getMySwaps(currentUserId).then((swaps) => {
      const active = swaps.find(
        (s) =>
          s.shift_id === shift.id &&
          (s.status === 'open' || s.status === 'matched')
      );
      setHasOpenSwap(!!active);
      setLoading(false);
    });
  }, [currentUserId, shift.id]);

  if (loading || isPastDeadline) return null;

  if (hasOpenSwap) {
    return (
      <p className="text-xs text-amber-600 mt-2">
        You have an open swap request for this shift.{' '}
        <span className="text-gray-500">Check the Messages tab to manage it.</span>
      </p>
    );
  }

  if (showForm) {
    return (
      <SwapRequestForm
        shift={shift}
        currentUserId={currentUserId}
        deadlineHours={deadlineHours}
        onSubmitted={() => {
          setHasOpenSwap(true);
          setShowForm(false);
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
    >
      <ArrowLeftRight className="h-4 w-4" />
      Request shift swap
    </button>
  );
}
