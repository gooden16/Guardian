import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ConversationsList } from './ConversationsList';
import { ChatView } from './ChatView';

const initialConversations = [
  {
    id: 1,
    customer: {
      id: 1,
      name: 'Alice Freeman',
      avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png',
      status: 'online'
    },
    lastMessage: {
      text: 'I need help with my recent order',
      timestamp: '2023-12-22T10:30:00Z',
      unread: true
    },
    messages: [
      {
        id: 1,
        type: 'customer',
        text: 'Hi, I need help with my recent order',
        timestamp: '2023-12-22T10:30:00Z'
      },
      {
        id: 2,
        type: 'agent',
        text: 'Hello Alice! I\'d be happy to help. Could you please provide your order number?',
        timestamp: '2023-12-22T10:31:00Z'
      }
    ]
  },
  {
    id: 2,
    customer: {
      id: 2,
      name: 'Bob Smith',
      avatar: 'https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png',
      status: 'offline'
    },
    lastMessage: {
      text: 'Thanks for your help!',
      timestamp: '2023-12-22T09:15:00Z',
      unread: false
    },
    messages: [
      {
        id: 1,
        type: 'customer',
        text: 'I have a question about the product',
        timestamp: '2023-12-22T09:10:00Z'
      },
      {
        id: 2,
        type: 'agent',
        text: 'Of course, what would you like to know?',
        timestamp: '2023-12-22T09:12:00Z'
      },
      {
        id: 3,
        type: 'customer',
        text: 'Thanks for your help!',
        timestamp: '2023-12-22T09:15:00Z'
      }
    ]
  }
];

export function ConversationsPage() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (text) => {
    if (!selectedConversation) return;

    const newMessage = {
      id: Date.now(),
      type: 'agent',
      text,
      timestamp: new Date().toISOString()
    };

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: {
            text,
            timestamp: newMessage.timestamp,
            unread: false
          }
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage]
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-1 min-w-0 overflow-hidden">
      <div className="h-[calc(100vh-4rem)] max-w-[1440px] mx-auto">
        <div className="h-full flex animate-fade-in">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col">
            <div className="p-4">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ConversationsList
                conversations={filteredConversations}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
              />
            </div>
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <ChatView
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}