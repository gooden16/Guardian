// src/components/ShiftView.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Users, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Shift, ShiftMessage, ShiftVolunteer } from '../types/shift';

interface ShiftViewProps {
 shift: {
   id: string;
   date: string;
   type: 'early' | 'late';
   volunteers: ShiftVolunteer[];
   messages?: ShiftMessage[];
   hebrew_parasha?: string;
 };
 isAdmin: boolean;
 isTeamLeader: boolean;
 onClose: () => void;
}

export function ShiftView(props: ShiftViewProps) {
 const { shift, isAdmin, isTeamLeader, onClose } = props;
 const [message, setMessage] = useState('');
 const [sending, setSending] = useState(false);

 const handleSendMessage = async () => {
   if (!message.trim()) return;
   setSending(true);
   
   try {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('Not authenticated');

     const { error } = await supabase
       .from('shift_messages')
       .insert({
         shift_id: shift.id,
         user_id: user.id,
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
       <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
         <div>
           <h2 className="text-lg font-semibold text-gray-900">
             {format(new Date(shift.date), 'MMMM d, yyyy')}
           </h2>
           {shift.hebrew_parasha && (
             <p className="text-sm text-gray-500 font-hebrew" dir="rtl" lang="he">
               {shift.hebrew_parasha}
             </p>
           )}
           <p className="text-sm text-gray-500">
             {shift.type === 'early' ? '8:35 AM - 10:10 AM' : '10:20 AM - 12:00 PM'}
           </p>
         </div>
         <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
           <X className="h-5 w-5" />
         </button>
       </div>

       <div className="flex-1 overflow-y-auto p-6">
         <div className="space-y-4">
           <div>
             <h3 className="text-sm font-medium text-gray-900 mb-2">
               Volunteers ({shift.volunteers.length}/4)
             </h3>
             {shift.volunteers.length > 0 ? (
               shift.volunteers.map(volunteer => (
                 <div key={volunteer.id} className="bg-gray-50 p-2 rounded mb-2">
                   <p className="text-sm font-medium">{volunteer.name}</p>
                   <p className="text-xs text-gray-500">{volunteer.role}</p>
                 </div>
               ))
             ) : (
               <p className="text-sm text-gray-500">No volunteers yet</p>
             )}
           </div>

           <div>
             <h3 className="text-sm font-medium text-gray-900 mb-2">Messages</h3>
             <div className="space-y-2">
               {shift.messages?.map(msg => (
                 <div key={msg.id} className="bg-gray-50 p-3 rounded">
                   <div className="flex justify-between text-xs text-gray-500 mb-1">
                     <span>{msg.senderName}</span>
                     <span>{format(new Date(msg.created_at), 'MMM d, h:mm a')}</span>
                   </div>
                   <p className="text-sm">{msg.message}</p>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>

       {(isAdmin || isTeamLeader) && (
         <div className="px-6 py-4 border-t border-gray-200">
           <div className="flex space-x-2">
             <input
               type="text"
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
               placeholder="Type a message..."
             />
             <button
               onClick={handleSendMessage}
               disabled={sending || !message.trim()}
               className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
