import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VolunteerManagement } from '../components/admin/VolunteerManagement';
import { QuarterCreation } from '../components/admin/QuarterCreation';
import { PreferencesOverview } from '../components/admin/PreferencesOverview';
import { QuarterStatusBadge } from '../components/QuarterStatus';
import { SchedulerResults } from '../components/SchedulerResults';
import { SwapManagement } from '../components/admin/SwapManagement';
import { Users, CalendarDays, Settings2, Cpu, Plus, ArrowLeftRight } from 'lucide-react';
import { getQuarters } from '../lib/quarters';
import type { Quarter } from '../types/quarter';

type Tab = 'volunteers' | 'quarters' | 'preferences' | 'scheduler' | 'swaps';

export function Admin() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('quarters');
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [activeQuarter, setActiveQuarter] = useState<Quarter | null>(null);
  const [showCreation, setShowCreation] = useState(false);
  const [loadingQuarters, setLoadingQuarters] = useState(true);

  useEffect(() => {
    getQuarters().then((qs) => {
      setQuarters(qs);
      setActiveQuarter(qs.find((q) => q.status !== 'closed') ?? qs[0] ?? null);
      setLoadingQuarters(false);
    });
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'quarters', label: 'Quarter', icon: CalendarDays },
    { id: 'preferences', label: 'Preferences', icon: Settings2 },
    { id: 'scheduler', label: 'Scheduler', icon: Cpu },
    { id: 'swaps', label: 'Swaps', icon: ArrowLeftRight },
    { id: 'volunteers', label: 'Volunteers', icon: Users },
  ];

  const tabClass = (id: Tab) =>
    `flex items-center gap-1.5 whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
      activeTab === id
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin</h1>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={tabClass(id)}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {/* ---- QUARTERS ---- */}
        {activeTab === 'quarters' && (
          <div className="space-y-4">
            {loadingQuarters ? (
              <div className="animate-pulse h-16 bg-gray-100 rounded-xl" />
            ) : activeQuarter && !showCreation ? (
              <QuarterStatusBadge
                quarter={activeQuarter}
                onStatusChange={(q) => {
                  setActiveQuarter(q);
                  setQuarters((prev) => prev.map((p) => (p.id === q.id ? q : p)));
                }}
              />
            ) : null}

            {showCreation ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <QuarterCreation
                  onCreated={(q) => {
                    setQuarters((prev) => [q, ...prev]);
                    setActiveQuarter(q);
                    setShowCreation(false);
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowCreation(true)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Create new quarter
              </button>
            )}

            {/* Past quarters list */}
            {quarters.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">All quarters</h3>
                {quarters.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuarter(q)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeQuarter?.id === q.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{q.name}</span>
                    <span className="text-xs capitalize text-gray-500">{q.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- PREFERENCES ---- */}
        {activeTab === 'preferences' && (
          <div>
            {activeQuarter ? (
              <PreferencesOverview quarterId={activeQuarter.id} />
            ) : (
              <p className="text-sm text-gray-500">No active quarter. Create one first.</p>
            )}
          </div>
        )}

        {/* ---- SCHEDULER ---- */}
        {activeTab === 'scheduler' && (
          <div>
            {activeQuarter ? (
              <SchedulerResults
                quarter={activeQuarter}
                onPublished={(q) => {
                  setActiveQuarter(q);
                  setQuarters((prev) => prev.map((p) => (p.id === q.id ? q : p)));
                }}
              />
            ) : (
              <p className="text-sm text-gray-500">No active quarter. Create one first.</p>
            )}
          </div>
        )}

        {/* ---- SWAPS ---- */}
        {activeTab === 'swaps' && <SwapManagement />}

        {/* ---- VOLUNTEERS ---- */}
        {activeTab === 'volunteers' && <VolunteerManagement />}
      </div>
    </div>
  );
}