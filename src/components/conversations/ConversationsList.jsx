import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function ConversationsList({ conversations, selectedId, onSelect, type }) {
  const renderConversation = (conversation) => {
    if (type === 'shifts') {
      return (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={clsx(
            'w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors',
            selectedId === conversation.id && 'bg-gray-50 dark:bg-dark-hover'
          )}
        >
          <div className="flex -space-x-2">
            {conversation.participants.slice(0, 3).map(participant => (
              <div key={participant.id} className="relative">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card"
                />
                {participant.status === 'online' && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-dark-card" />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {format(new Date(conversation.shiftDate), 'MMM d')} Shift
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(conversation.lastMessage.timestamp), 'HH:mm')}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {conversation.participants.map(p => p.name).join(', ')}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conversation.lastMessage.text}
              </p>
              {conversation.lastMessage.unread && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>
        </button>
      );
    } else {
      return (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={clsx(
            'w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors',
            selectedId === conversation.id && 'bg-gray-50 dark:bg-dark-hover'
          )}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {conversation.participants}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {conversation.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(conversation.lastMessage.timestamp), 'HH:mm')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {conversation.lastMessage.text}
              </p>
              {conversation.lastMessage.unread && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </div>
        </button>
      );
    }
  };

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map(renderConversation)}
    </div>
  );
}
