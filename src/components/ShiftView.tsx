import React, { useState } from 'react';
import { format } from 'date-fns';
import { Users, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Shift } from '../types/shift';

interface ShiftViewProps {
  shift: Shift;
  isAdmin: boolean;
  isTeamLeader: boolean;
  onClose: () => void;
}

export function ShiftView({ shift, isAdmin, isTeamLeader, onClose }: ShiftViewProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('shift_messages')
        .insert({
          shift_id: shift.id,
          message: message.trim()
        });

      if (error) throw error;
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(new Date(shift.date), 'MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-500">
              {shift.type === 'early' ? '8:35 AM - 10:10 AM' : '10:20 AM - 12:00 PM'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {/* Volunteers */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Volunteers ({shift.volunteers.length}/4)
            </h3>
            <div className="space-y-2">
              {shift.volunteers.map(volunteer => (
                <div
                  key={volunteer.id}
                  className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{volunteer.name}</p>
                    <p className="text-xs text-gray-500">{volunteer.role}</p>
                  </div>
                </div>
              ))}
              {shift.volunteers.length === 0 && (
                <p className="text-sm text-gray-500">No volunteers signed up yet</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Messages</h3>
            <div className="space-y-4 min-h-[100px]">
              {shift.messages?.map(msg => (
                <div key={msg.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-900">{msg.senderName}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Input */}
        {(isAdmin || isTeamLeader) && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}