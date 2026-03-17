import React, { useState, useEffect } from 'react';
import { CalendarDays, ListFilter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentQuarter } from '../lib/quarters';
import { getQuarterShifts, getMyAssignments, groupShiftsByDate } from '../lib/shifts';
import { EventCard } from '../components/EventCard';
import { EventDetail } from '../components/EventDetail';
import { SwapRequestButton } from '../components/SwapRequestButton';
import type { Quarter } from '../types/quarter';
import type { EventDay } from '../types/shift';
import { format, parseISO } from 'date-fns';

type View = 'mine' | 'all';

export function Schedule() {
  const { user } = useAuth();
  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [myEvents, setMyEvents] = useState<EventDay[]>([]);
  const [allEvents, setAllEvents] = useState<EventDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('mine');
  const [selectedEvent, setSelectedEvent] = useState<EventDay | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    getCurrentQuarter().then(async (q) => {
      if (!q) {
        setLoading(false);
        return;
      }
      setQuarter(q);

      const [mine, all] = await Promise.all([
        getMyAssignments(q.id),
        // Only fetch all shifts for published or active quarters
        q.status === 'active' || q.status === 'scheduled'
          ? getQuarterShifts(q.id)
          : Promise.resolve([]),
      ]);

      setMyEvents(groupShiftsByDate(mine));
      setAllEvents(groupShiftsByDate(all));
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!quarter) {
    return (
      <div className="text-center py-20">
        <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No active quarter</p>
        <p className="text-sm text-gray-400 mt-1">Check back when the next quarter is set up.</p>
      </div>
    );
  }

  const displayEvents = view === 'mine' ? myEvents : allEvents;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">{quarter.name}</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['mine', 'all'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === v
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'mine' ? 'My shifts' : 'All shifts'}
          </button>
        ))}
      </div>

      {/* Empty states */}
      {view === 'mine' && myEvents.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <CalendarDays className="h-10 w-10 text-gray-200 mx-auto" />
          <p className="text-gray-500 text-sm">
            {quarter.status === 'setup' || quarter.status === 'preferences'
              ? 'The schedule hasn\'t been generated yet. Make sure to submit your preferences!'
              : 'You don\'t have any shifts assigned for this quarter.'}
          </p>
        </div>
      )}

      {view === 'all' && allEvents.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">
            {quarter.status === 'setup' || quarter.status === 'preferences'
              ? 'The schedule isn\'t published yet.'
              : 'No events found for this quarter.'}
          </p>
        </div>
      )}

      {/* Event list */}
      <div className="space-y-2">
        {displayEvents.map((event) => (
          <EventCard
            key={event.date}
            event={event}
            currentUserId={user?.id ?? ''}
            variant={
              (event.early_shift?.volunteers.some((v) => v.user_id === user?.id) ||
               event.late_shift?.volunteers.some((v) => v.user_id === user?.id))
                ? 'mine'
                : 'normal'
            }
            onClick={() => setSelectedEvent(event)}
          />
        ))}
      </div>

      {/* Event detail drawer */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          currentUserId={user?.id ?? ''}
          onClose={() => setSelectedEvent(null)}
          swapSlot={
            user && quarter?.status === 'active' ? (
              <SwapRequestButton
                shift={
                  selectedEvent.early_shift?.volunteers.some((v) => v.user_id === user.id)
                    ? selectedEvent.early_shift!
                    : selectedEvent.late_shift!
                }
                currentUserId={user.id}
                deadlineHours={quarter.swap_deadline_hours ?? 48}
              />
            ) : undefined
          }
        />
      )}
    </div>
  );
}
