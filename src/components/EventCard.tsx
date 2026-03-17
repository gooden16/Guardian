import React from 'react';
import { format, parseISO } from 'date-fns';
import { Users, CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import type { EventDay } from '../types/shift';

interface EventCardProps {
  event: EventDay;
  currentUserId: string;
  /** 'mine' = highlighted as user's own assignment */
  variant?: 'normal' | 'mine';
  onClick?: () => void;
}

function staffingStatus(count: number, min = 3) {
  if (count >= 4) return { label: 'Full', icon: CheckCircle2, color: 'text-green-600' };
  if (count >= min) return { label: `${count} volunteers`, icon: Users, color: 'text-blue-600' };
  if (count > 0) return { label: `${count} — needs more`, icon: AlertCircle, color: 'text-amber-600' };
  return { label: 'No volunteers yet', icon: Circle, color: 'text-gray-400' };
}

export function EventCard({ event, currentUserId, variant = 'normal', onClick }: EventCardProps) {
  const date = parseISO(event.date);
  const dayOfWeek = format(date, 'EEE');
  const dayOfMonth = format(date, 'd');
  const month = format(date, 'MMM');

  const earlyCount = event.early_shift?.volunteers.length ?? 0;
  const lateCount = event.late_shift?.volunteers.length ?? 0;
  const isAssignedEarly = event.early_shift?.volunteers.some((v) => v.user_id === currentUserId) ?? false;
  const isAssignedLate = event.late_shift?.volunteers.some((v) => v.user_id === currentUserId) ?? false;
  const isAssigned = isAssignedEarly || isAssignedLate;

  const early = staffingStatus(earlyCount);
  const late = staffingStatus(lateCount);
  const EarlyIcon = early.icon;
  const LateIcon = late.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all active:scale-[0.98] ${
        variant === 'mine'
          ? 'border-indigo-200 bg-indigo-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-stretch">
        {/* Date column */}
        <div className={`flex flex-col items-center justify-center px-4 py-3 rounded-l-xl min-w-[60px] ${
          variant === 'mine' ? 'bg-indigo-100' : 'bg-gray-50'
        }`}>
          <span className="text-xs font-medium text-gray-500 uppercase">{dayOfWeek}</span>
          <span className={`text-2xl font-bold leading-none mt-0.5 ${variant === 'mine' ? 'text-indigo-700' : 'text-gray-900'}`}>
            {dayOfMonth}
          </span>
          <span className="text-xs text-gray-500">{month}</span>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold leading-snug ${variant === 'mine' ? 'text-indigo-900' : 'text-gray-900'}`}>
              {event.event_title}
            </p>
            {isAssigned && (
              <span className="ml-2 shrink-0 text-xs font-medium bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                Assigned
              </span>
            )}
          </div>

          {event.event_notes && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 leading-snug">
              {event.event_notes}
            </p>
          )}

          {/* Shift status rows */}
          {(event.early_shift || event.late_shift) && (
            <div className="flex gap-4 pt-0.5">
              {event.early_shift && (
                <div className="flex items-center gap-1.5">
                  <EarlyIcon className={`h-3.5 w-3.5 ${early.color}`} />
                  <span className="text-xs text-gray-500">Early · {early.label}</span>
                  {isAssignedEarly && <span className="text-xs text-indigo-600 font-medium">· You</span>}
                </div>
              )}
              {event.late_shift && (
                <div className="flex items-center gap-1.5">
                  <LateIcon className={`h-3.5 w-3.5 ${late.color}`} />
                  <span className="text-xs text-gray-500">Late · {late.label}</span>
                  {isAssignedLate && <span className="text-xs text-indigo-600 font-medium">· You</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
