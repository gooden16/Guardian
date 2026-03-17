import React, { useState, useEffect, useRef } from 'react';
import { Send, Megaphone, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnnouncements, postAnnouncement, subscribeToAnnouncements } from '../lib/announcements';
import { getOpenSwaps, getMySwaps, subscribeToSwaps } from '../lib/swaps';
import { getCurrentQuarter } from '../lib/quarters';
import { Avatar } from '../components/Avatar';
import { SwapFeedCard } from '../components/SwapFeedCard';
import type { Announcement } from '../types/announcement';
import type { SwapRequest } from '../types/swap';
import type { Quarter } from '../types/quarter';
import { format, parseISO } from 'date-fns';

type Tab = 'announcements' | 'swaps';

export function Messages() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('announcements');
  const [quarter, setQuarter] = useState<Quarter | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [openSwaps, setOpenSwaps] = useState<SwapRequest[]>([]);
  const [mySwaps, setMySwaps] = useState<SwapRequest[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(true);

  useEffect(() => {
    getCurrentQuarter().then(setQuarter);
  }, []);

  useEffect(() => {
    getAnnouncements().then((data) => {
      setAnnouncements(data.reverse());
      setLoadingAnn(false);
    });
    return subscribeToAnnouncements((a) =>
      setAnnouncements((prev) => [...prev, a])
    );
  }, []);

  useEffect(() => {
    if (!user || !quarter) return;
    const load = () => {
      Promise.all([getOpenSwaps(quarter.id), getMySwaps(user.id)]).then(
        ([open, mine]) => {
          setOpenSwaps(open.filter((s) => s.requester_id !== user.id));
          setMySwaps(mine);
          setLoadingSwaps(false);
        }
      );
    };
    load();
    return subscribeToSwaps(load);
  }, [user, quarter]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [announcements]);

  const handlePost = async () => {
    if (!user || !newMsg.trim()) return;
    setPosting(true);
    try {
      await postAnnouncement(user.id, newMsg.trim());
      setNewMsg('');
    } finally {
      setPosting(false);
    }
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  const pendingSwaps =
    openSwaps.length +
    mySwaps.filter((s) => s.status === 'matched').length;

  const reloadSwaps = () => {
    if (!user || !quarter) return;
    Promise.all([getOpenSwaps(quarter.id), getMySwaps(user.id)]).then(
      ([open, mine]) => {
        setOpenSwaps(open.filter((s) => s.requester_id !== user.id));
        setMySwaps(mine);
      }
    );
  };

  return (
    <div className="flex flex-col space-y-5" style={{ minHeight: 0 }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        {quarter && <p className="text-sm text-gray-500 mt-0.5">{quarter.name}</p>}
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit shrink-0">
        <button className={tabClass('announcements')} onClick={() => setTab('announcements')}>
          <span className="flex items-center gap-1.5">
            <Megaphone className="h-4 w-4" />
            Announcements
          </span>
        </button>
        <button className={tabClass('swaps')} onClick={() => setTab('swaps')}>
          <span className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-4 w-4" />
            Shift swaps
            {pendingSwaps > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingSwaps}
              </span>
            )}
          </span>
        </button>
      </div>

      {tab === 'announcements' && (
        <div className="flex flex-col gap-4">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {loadingAnn ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-16">
                <Megaphone className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No announcements yet.</p>
              </div>
            ) : (
              announcements.map((a) => (
                <AnnouncementRow key={a.id} announcement={a} currentUserId={user?.id ?? ''} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2">
            <textarea
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost();
              }}
              placeholder={isAdmin ? 'Post an announcement to all volunteers…' : 'Write a message…'}
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handlePost}
              disabled={posting || !newMsg.trim()}
              className="self-end px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {tab === 'swaps' && (
        <div className="space-y-6">
          {mySwaps.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                My swap requests
              </h2>
              {mySwaps.map((sr) => (
                <SwapFeedCard
                  key={sr.id}
                  swap={sr}
                  currentUserId={user?.id ?? ''}
                  onAction={reloadSwaps}
                />
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Looking for coverage
            </h2>
            {loadingSwaps ? (
              <div className="animate-pulse h-20 bg-gray-100 rounded-xl" />
            ) : openSwaps.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No open swap requests right now.
              </p>
            ) : (
              openSwaps.map((sr) => (
                <SwapFeedCard
                  key={sr.id}
                  swap={sr}
                  currentUserId={user?.id ?? ''}
                  onAction={reloadSwaps}
                />
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function AnnouncementRow({
  announcement: a,
  currentUserId,
}: {
  announcement: Announcement;
  currentUserId: string;
}) {
  const isMe = a.author.id === currentUserId;
  const name = `${a.author.first_name} ${a.author.last_name}`;

  return (
    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
      <Avatar url={a.author.avatar_url} name={name} size="sm" />
      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-gray-600">{isMe ? 'You' : name}</span>
          <span className="text-xs text-gray-400">
            {format(parseISO(a.created_at), 'MMM d, h:mm a')}
          </span>
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm ${
            isMe
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          }`}
        >
          {a.body}
        </div>
      </div>
    </div>
  );
}
