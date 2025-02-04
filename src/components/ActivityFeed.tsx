import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { UserPlus, Calendar, LogOut } from 'lucide-react';

interface ActivityEvent {
  id: string;
  event_type: 'user_signup' | 'shift_signup' | 'shift_withdrawal';
  event_data: {
    name: string;
    shift_type?: string;
    shift_date?: string;
    reason?: string;
  };
  created_at: string;
}

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_feed')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity feed');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Subscribe to new events
    const subscription = supabase
      .channel('activity_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activity_feed'
      }, (payload) => {
        setEvents(current => [payload.new as ActivityEvent, ...current].slice(0, 50));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm text-center py-4">
        {error}
      </div>
    );
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'user_signup':
        return <UserPlus className="h-5 w-5 text-green-600" />;
      case 'shift_withdrawal':
        return <LogOut className="h-5 w-5 text-red-600" />;
      default:
        return <Calendar className="h-5 w-5 text-blue-600" />;
    }
  };

  const getEventBgColor = (eventType: string) => {
    switch (eventType) {
      case 'user_signup':
        return 'bg-green-100';
      case 'shift_withdrawal':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  const renderEventContent = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'user_signup':
        return (
          <span>
            <span className="font-medium text-gray-900">{event.event_data.name}</span>
            {' joined Guardian'}
          </span>
        );
      case 'shift_signup':
        return (
          <span>
            <span className="font-medium text-gray-900">{event.event_data.name}</span>
            {' signed up for '}
            <span className="font-medium text-gray-900">
              {event.event_data.shift_type === 'early' ? 'Early' : 'Late'}
              {' Shift'}
            </span>
            {' on '}
            <span className="font-medium text-gray-900">
              {format(new Date(event.event_data.shift_date!), 'MMMM d, yyyy')}
            </span>
          </span>
        );
      case 'shift_withdrawal':
        return (
          <span>
            <span className="font-medium text-gray-900">{event.event_data.name}</span>
            {' withdrew from '}
            <span className="font-medium text-gray-900">
              {event.event_data.shift_type === 'early' ? 'Early' : 'Late'}
              {' Shift'}
            </span>
            {' on '}
            <span className="font-medium text-gray-900">
              {format(new Date(event.event_data.shift_date!), 'MMMM d, yyyy')}
            </span>
            {event.event_data.reason && (
              <span className="block mt-1 text-xs text-gray-500">
                Reason: {event.event_data.reason}
              </span>
            )}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
      <div className="flow-root">
        <ul className="-mb-8">
          {events.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getEventBgColor(event.event_type)}`}>
                      {getEventIcon(event.event_type)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-500">
                        {renderEventContent(event)}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {format(new Date(event.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}