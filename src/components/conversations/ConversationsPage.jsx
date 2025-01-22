import { useState, useEffect, useCallback } from 'react';
import { ConversationsList } from './ConversationsList';
import { ChatView } from './ChatView';
import { Button } from '../ui/Button';
import { getConversations, sendMessage, subscribeToConversation } from '../../lib/database';
import toast from 'react-hot-toast';

export function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeTab, setActiveTab] = useState('shifts');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      
      // Update selected conversation if it exists
      if (selectedConversation) {
        const updated = data.find(c => c.id === selectedConversation.id);
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    let subscription;
    if (selectedConversation) {
      subscription = subscribeToConversation(selectedConversation.id, (newMessage) => {
        setSelectedConversation(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), newMessage]
        }));
        loadConversations();
      });
    }
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [selectedConversation, loadConversations]);

  const handleSendMessage = async (text) => {
    if (!selectedConversation) return;

    try {
      await sendMessage(selectedConversation.id, text);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeTab !== conv.type) return false;
    
    const searchTerm = searchQuery.toLowerCase();
    if (conv.type === 'shift') {
      return conv.participants.some(p => 
        p.volunteer.name.toLowerCase().includes(searchTerm)
      );
    } else {
      return conv.name.toLowerCase().includes(searchTerm);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

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