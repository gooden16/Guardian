import React, { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Info, Clock, Users } from 'lucide-react';
import type { EventDay } from '../types/shift';
import { Avatar } from './Avatar';

const ROLE_LABELS: Record<string, string> = { TL: 'Team Leader', L2: 'L2', L1: 'L1' };
const ROLE_COLORS: Record<string, string> = {
  TL: 'bg-purple-100 text-purple-700',
  L2: 'bg-blue-100 text-blue-700',
  L1: 'bg-green-100 text-green-700',
};

interface EventDetailProps {
  event: EventDay;
  currentUserId: string;
  onClose: () => void;
  /** Render slot for swap button — passed in so SwapRequestButton can live in Phase 5 */
  swapSlot?: React.ReactNode;
}

export function EventDetail({ event, currentUserId, onClose, swapSlot }: EventDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const date = parseISO(event.date);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      {/* Sheet / Modal */}
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {format(date, 'EEEE, MMMM d')}
            </p>
            <h2 className="text-lg font-bold text-gray-900 mt-0.5">{event.event_title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-5">
            {/* Event notes */}
            {event.event_notes && (
              <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">{event.event_notes}</p>
              </div>
            )}

            {/* Shifts */}
            {[
              { shift: event.early_shift, label: 'Early shift', time: '8:35–10:10 AM' },
              { shift: event.late_shift, label: 'Late shift', time: '10:20 AM–12:00 PM' },
            ].map(({ shift, label, time }) => {
              if (!shift) return null;
              const isMyShift = shift.volunteers.some((v) => v.user_id === currentUserId);

              return (
                <section key={shift.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      {label}
                      <span className="ml-1.5 font-normal text-gray-500 text-xs">{time}</span>
                    </h3>
                    {isMyShift && (
                      <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        You're on this shift
                      </span>
                    )}
                  </div>

                  {shift.status === 'draft' && (
                    <p className="text-xs text-gray-400 italic mb-2">
                      Schedule not published yet — roster hidden
                    </p>
                  )}

                  {shift.status === 'published' && (
                    <div className="space-y-2">
                      {shift.volunteers.length === 0 ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                          <Users className="h-4 w-4" />
                          No volunteers assigned yet
                        </div>
                      ) : (
                        shift.volunteers.map((v) => (
                          <div key={v.id} className="flex items-center gap-3">
                            <Avatar
                              url={v.avatar_url}
                              name={`${v.first_name} ${v.last_name}`}
                              size="sm"
                            />
                            <span className="text-sm text-gray-800 flex-1">
                              {v.first_name} {v.last_name}
                              {v.user_id === currentUserId && (
                                <span className="ml-1 text-xs text-indigo-600">(you)</span>
                              )}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[v.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {ROLE_LABELS[v.role] ?? v.role}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Swap slot — rendered only for the user's own shift */}
                  {isMyShift && swapSlot}
                </section>
              );
            })}
          </div>
        </div>

        {/* Footer handle for mobile */}
        <div className="sm:hidden h-5 flex items-center justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
