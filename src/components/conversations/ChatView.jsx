import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';

function ChatMessage({ message, isConsecutive }) {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-hover px-3 py-1 rounded-full">
          {message.text}
        </p>
      </div>
    );
  }

  const isCurrentUser = message.sender.name === 'You';
  
  return (
    <div className={clsx(
      'flex gap-3',
      isCurrentUser ? 'justify-end' : 'justify-start',
      isConsecutive ? 'mt-1' : 'mt-4'
    )}>
      {!isCurrentUser && !isConsecutive && (
        <img
          src={message.sender.avatar}
          alt={message.sender.name}
          className="w-8 h-8 rounded-full"
        />
      )}
      {!isCurrentUser && isConsecutive && <div className="w-8" />}
      <div className={clsx(
        'max-w-[70%]',
        isCurrentUser ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-dark-hover',
        'rounded-2xl px-4 py-2'
      )}>
        {!isCurrentUser && !isConsecutive && (
          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
            {message.sender.name}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p className={clsx(
          'text-xs mt-1',
          isCurrentUser ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
        )}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
}

export function ChatView({ conversation, onSendMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const renderHeader = () => {
    if (conversation.type === 'shift') {
      return (
        <div className="flex items-center gap-3">
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
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              {format(new Date(conversation.shiftDate), 'MMMM d')} Shift
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.participants.length} participants
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {conversation.participants}
            </span>
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              {conversation.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.participants} participants
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        {renderHeader()}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isConsecutive={
              index > 0 && 
              conversation.messages[index - 1].type === message.type &&
              conversation.messages[index - 1].sender?.name === message.sender?.name &&
              new Date(message.timestamp).getTime() - 
              new Date(conversation.messages[index - 1].timestamp).getTime() < 300000
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:hover:bg-primary text-white font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </>
  );
}
