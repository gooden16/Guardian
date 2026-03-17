import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { addHours, parseISO } from 'date-fns';
import { requestSwap } from '../lib/swaps';
import type { Shift } from '../types/shift';

interface SwapRequestFormProps {
  shift: Shift;
  currentUserId: string;
  deadlineHours: number;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function SwapRequestForm({
  shift,
  currentUserId,
  deadlineHours,
  onSubmitted,
  onCancel,
}: SwapRequestFormProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      // Expires 48h (or deadlineHours) before the shift
      const shiftStart = parseISO(`${shift.date}T08:35:00`);
      const expiresAt = new Date(shiftStart.getTime() - deadlineHours * 60 * 60 * 1000);

      await requestSwap({
        requesterId: currentUserId,
        shiftId: shift.id,
        reason: reason.trim(),
        expiresAt: expiresAt.toISOString(),
      });
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">Request swap</p>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Reason <span className="text-gray-400">(visible to all volunteers)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Out of town that weekend"
          rows={2}
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !reason.trim()}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        {submitting ? 'Submitting…' : 'Submit request'}
      </button>

      <p className="text-xs text-gray-400">
        Your request will be visible to all volunteers who are eligible to cover this shift.
        Swap requests close {deadlineHours}h before the shift.
      </p>
    </form>
  );
}
