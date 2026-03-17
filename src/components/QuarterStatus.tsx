import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, Clock, Users, CalendarCheck, Archive } from 'lucide-react';
import type { Quarter, QuarterStatus } from '../types/quarter';
import { advanceQuarterStatus } from '../lib/quarters';

interface QuarterStatusProps {
  quarter: Quarter;
  onStatusChange: (q: Quarter) => void;
}

const STATUS_CONFIG: Record<QuarterStatus, {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  nextStatus?: QuarterStatus;
  nextLabel?: string;
}> = {
  setup: {
    label: 'Setup',
    description: 'Create and review events for the quarter',
    icon: CalendarCheck,
    color: 'text-blue-600 bg-blue-50',
    nextStatus: 'preferences',
    nextLabel: 'Open for preferences',
  },
  preferences: {
    label: 'Collecting preferences',
    description: 'Volunteers are submitting their availability',
    icon: Users,
    color: 'text-amber-600 bg-amber-50',
    nextStatus: 'scheduled',
    nextLabel: 'Run auto-scheduler',
  },
  scheduled: {
    label: 'Draft schedule',
    description: 'Review the auto-generated schedule before publishing',
    icon: Clock,
    color: 'text-purple-600 bg-purple-50',
    nextStatus: 'active',
    nextLabel: 'Publish schedule',
  },
  active: {
    label: 'Active',
    description: 'Schedule is published — volunteers can see their shifts',
    icon: CheckCircle2,
    color: 'text-green-600 bg-green-50',
    nextStatus: 'closed',
    nextLabel: 'Close quarter',
  },
  closed: {
    label: 'Closed',
    description: 'This quarter has ended',
    icon: Archive,
    color: 'text-gray-600 bg-gray-50',
  },
};

export function QuarterStatusBadge({ quarter, onStatusChange }: QuarterStatusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const config = STATUS_CONFIG[quarter.status];
  const Icon = config.icon;

  const handleAdvance = async () => {
    if (!config.nextStatus) return;
    setLoading(true);
    setError('');
    try {
      await advanceQuarterStatus(quarter.id, config.nextStatus);
      onStatusChange({ ...quarter, status: config.nextStatus });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{quarter.name}</p>
            <p className="text-xs text-gray-500">{config.label} — {config.description}</p>
          </div>
        </div>

        {config.nextStatus && config.nextLabel && (
          <button
            onClick={handleAdvance}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-indigo-700" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {config.nextLabel}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
