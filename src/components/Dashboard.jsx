import React from 'react';
import { StatCard } from './dashboard/StatCard';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { format } from 'date-fns';
import { Card } from './ui/Card';
import { ShiftTime } from '../models/Shift';
import { isShiftDay, getHolidayName, getNextShiftDates } from '../utils/jewishCalendar';

// Get the next 3 shift dates
const nextShiftDates = getNextShiftDates(3);

// Create upcoming shifts based on the next valid dates
const UPCOMING_SHIFTS = [
  {
    date: nextShiftDates[0],
    time: ShiftTime.EARLY_MORNING,
    role: 'Team Leader',
    spotsAvailable: 1
  },
  {
    date: nextShiftDates[0],
    time: ShiftTime.LATE_MORNING,
    role: 'Level 1',
    spotsAvailable: 2
  },
  {
    date: nextShiftDates[1],
    time: ShiftTime.EARLY_MORNING,
    role: 'Level 2',
    spotsAvailable: 1
  }
];

const RECENT_CONVERSATIONS = [
  {
    id: 1,
    type: 'shift',
    shiftDate: '2024-01-13', // Shabbat
    participants: [
      {
        id: 1,
        name: 'David Cohen',
        avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png'
      },
      {
        id: 2,
        name: 'Sarah Levy',
        avatar: 'https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png'
      }
    ],
    lastMessage: {
      text: "I'll bring an extra table for setup",
      timestamp: '2024-01-12T15:30:00Z',
      unread: true
    }
  },
  {
    id: 2,
    type: 'general',
    name: 'General Discussion',
    participants: 45,
    lastMessage: {
      text: 'Thanks for organizing the training session!',
      timestamp: '2024-01-12T16:00:00Z',
      unread: false
    }
  }
];

export function Dashboard({ onViewShift }) {
  const handleShiftClick = (shift) => {
    if (onViewShift) {
      onViewShift(shift);
    }
  };

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap justify-between gap-3 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Dashboard</h1>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <StatCard title="Your upcoming shifts" value="3" change="+1 this month" />
          <StatCard title="Total shifts completed" value="12" change="+5 this quarter" />
          <StatCard title="Active conversations" value="5" change="+2 new messages" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upcoming Shifts */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Upcoming Shifts
                </h2>
                <div className="space-y-3">
                  {UPCOMING_SHIFTS.filter(shift => isShiftDay(shift.date)).map((shift, index) => (
                    <button
                      key={index}
                      onClick={() => handleShiftClick(shift)}
                      className="w-full p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(shift.date, 'EEEE, MMMM d')}
                          </p>
                          {getHolidayName(shift.date) && (
                            <p className="text-sm text-primary">
                              {getHolidayName(shift.date)}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {shift.time === ShiftTime.EARLY_MORNING ? '8:35 AM - 10:20 AM' : '10:10 AM - 12:00 PM'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {shift.role}
                          </p>
                          {shift.spotsAvailable > 0 ? (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {shift.spotsAvailable} spot{shift.spotsAvailable !== 1 ? 's' : ''} available
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Fully staffed
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Recent Conversations */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Conversations
                </h2>
                <div className="space-y-3">
                  {RECENT_CONVERSATIONS.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                    >
                      {conversation.type === 'shift' ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-2">
                              {conversation.participants.map(participant => (
                                <img
                                  key={participant.id}
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card"
                                />
                              ))}
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {format(new Date(conversation.shiftDate), 'MMM d')} Shift
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {conversation.participants}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {conversation.name}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage.text}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {format(new Date(conversation.lastMessage.timestamp), 'h:mm a')}
                        </p>
                        {conversation.lastMessage.unread && (
                          <span className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <ActivityFeed />
          </div>
        </div>
      </div>
    </main>
  );
}