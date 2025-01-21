import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { ConversationsList } from './ConversationsList';
import { ChatView } from './ChatView';
import { Button } from '../ui/Button';

// Mock data for conversations
const initialConversations = {
  shifts: [
    {
      id: 1,
      type: 'shift',
      shiftDate: '2024-01-13',
      shiftTime: 'EARLY_MORNING',
      participants: [
        {
          id: 1,
          name: 'David Cohen',
          avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png',
          role: 'Team Leader',
          status: 'online'
        },
        {
          id: 2,
          name: 'Sarah Levy',
          avatar: 'https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png',
          role: 'Level 1',
          status: 'offline'
        }
      ],
      lastMessage: {
        text: "I'll bring an extra table for setup",
        timestamp: '2024-01-12T15:30:00Z',
        unread: true
      },
      messages: [
        {
          id: 1,
          type: 'system',
          text: 'Shift chat started for Saturday Morning Shift (8:35 AM - 10:20 AM)',
          timestamp: '2024-01-12T10:00:00Z'
        },
        {
          id: 2,
          type: 'volunteer',
          sender: {
            name: 'David Cohen',
            avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png'
          },
          text: 'Good morning everyone! Looking forward to working with you tomorrow.',
          timestamp: '2024-01-12T14:00:00Z'
        },
        {
          id: 3,
          type: 'volunteer',
          sender: {
            name: 'Sarah Levy',
            avatar: 'https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png'
          },
          text: 'Me too! Do we need to bring anything special?',
          timestamp: '2024-01-12T14:05:00Z'
        },
        {
          id: 4,
          type: 'volunteer',
          sender: {
            name: 'David Cohen',
            avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png'
          },
          text: "I'll bring an extra table for setup",
          timestamp: '2024-01-12T15:30:00Z'
        }
      ]
    }
  ],
  general: [
    {
      id: 2,
      type: 'general',
      name: 'General Discussion',
      participants: 45,
      lastMessage: {
        text: 'Thanks for organizing the training session!',
        timestamp: '2024-01-12T16:00:00Z',
        unread: false
      },
      messages: [
        {
          id: 1,
          type: 'volunteer',
          sender: {
            name: 'Rachel Gold',
            avatar: 'https://cdn.usegalileo.ai/stability/e9fdb59b-64bb-4239-8e52-f71e0cfb538e.png'
          },
          text: 'Thanks for organizing the training session!',
          timestamp: '2024-01-12T16:00:00Z'
        }
      ]
    },
    {
      id: 3,
      type: 'general',
      name: 'Team Leaders',
      participants: 12,
      lastMessage: {
        text: 'New shift procedures document is available',
        timestamp: '2024-01-12T14:30:00Z',
        unread: true
      },
      messages: [
        {
          id: 1,
          type: 'volunteer',
          sender: {
            name: 'Admin',
            avatar: 'https://cdn.usegalileo.ai/stability/1af7ccee-eb75-4af5-b80e-ee2ec64a79ef.png'
          },
          text: 'New shift procedures document is available',
          timestamp: '2024-01-12T14:30:00Z'
        }
      ]
    }
  ]
};

export function ConversationsPage() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' or 'general'
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (text) => {
    if (!selectedConversation) return;

    const newMessage = {
      id: Date.now(),
      type: 'volunteer',
      sender: {
        name: 'You',
        avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png'
      },
      text,
      timestamp: new Date().toISOString()
    };

    // Update conversations state with the new message
    const updatedConversations = {
      ...conversations,
      [activeTab]: conversations[activeTab].map(conv => {
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
      })
    };

    setConversations(updatedConversations);

    // Update selected conversation to show new message
    setSelectedConversation({
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: {
        text,
        timestamp: newMessage.timestamp,
        unread: false
      }
    });
  };

  const filteredConversations = conversations[activeTab].filter(conv => {
    const searchTerm = searchQuery.toLowerCase();
    if (conv.type === 'shift') {
      return conv.participants.some(p => 
        p.name.toLowerCase().includes(searchTerm)
      );
    } else {
      return conv.name.toLowerCase().includes(searchTerm);
    }
  });

  return (
    <main className="flex-1 min-w-0 overflow-hidden">
      <div className="h-[calc(100vh-4rem)] max-w-[1440px] mx-auto">
        <div className="h-full flex animate-fade-in">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col">
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-hover text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'shifts' ? 'primary' : 'secondary'}
                  onClick={() => setActiveTab('shifts')}
                  className="flex-1"
                >
                  Shifts
                </Button>
                <Button
                  variant={activeTab === 'general' ? 'primary' : 'secondary'}
                  onClick={() => setActiveTab('general')}
                  className="flex-1"
                >
                  General
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ConversationsList
                conversations={filteredConversations}
                selectedId={selectedConversation?.id}
                onSelect={setSelectedConversation}
                type={activeTab}
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