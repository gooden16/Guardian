import React from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function ConversationsList({ conversations, selectedId, onSelect }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation)}
          className={clsx(
            'w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors',
            selectedId === conversation.id && 'bg-gray-50 dark:bg-dark-hover'
          )}
        >
          <div className="relative">
            <img
              src={conversation.customer.avatar}
              alt={conversation.customer.name}
              className="w-10 h-10 rounded-full"
            />
            <span className={clsx(
              'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-dark-card',
              conversation.customer.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
            )} />
          </div>
          
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {conversation.customer.name}
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
      ))}
    </div>
  );
}