import React, { useState, useEffect } from 'react';
import { Play, Send, AlertTriangle, CheckCircle2, Cpu, RefreshCw } from 'lucide-react';
import { runScheduler, getLastRun, publishSchedule, type SchedulerRun } from '../lib/scheduler';
import type { Quarter } from '../types/quarter';

interface SchedulerResultsProps {
  quarter: Quarter;
  onPublished: (q: Quarter) => void;
}

export function SchedulerResults({ quarter, onPublished }: SchedulerResultsProps) {
  const [lastRun, setLastRun] = useState<SchedulerRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [running, setRunning] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getLastRun(quarter.id).then((run) => {
      setLastRun(run);
      setLoadingRun(false);
    });
  }, [quarter.id]);

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const { run_id, summary } = await runScheduler(quarter.id);
      setLastRun({
        id: run_id,
        quarter_id: quarter.id,
        status: 'completed',
        result_summary: summary,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scheduler failed');
    } finally {
      setRunning(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    try {
      await publishSchedule(quarter.id);
      onPublished({ ...quarter, status: 'active' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  if (quarter.status === 'active') {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">Schedule is live</p>
          <p className="text-xs text-green-600">Volunteers can see their assignments.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Cpu className="h-5 w-5 text-indigo-600" />
        <h3 className="text-base font-semibold text-gray-900">Auto-scheduler</h3>
      </div>

      <p className="text-sm text-gray-600">
        The scheduler reads all volunteer preferences and generates a draft shift schedule.
        You can review and adjust it before publishing.
      </p>

      {/* Last run results */}
      {!loadingRun && lastRun?.result_summary && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-gray-800">
              Last run: {lastRun.result_summary.assigned} assignments made
            </span>
          </div>

          {lastRun.result_summary.warnings.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">
                  {lastRun.result_summary.warnings.length} warning{lastRun.result_summary.warnings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {lastRun.result_summary.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-gray-600 pl-4 border-l-2 border-amber-200">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={running || publishing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
        >
          {running ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {lastRun ? 'Re-run scheduler' : 'Run scheduler'}
        </button>

        {lastRun && quarter.status === 'scheduled' && (
          <button
            onClick={handlePublish}
            disabled={running || publishing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {publishing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish schedule
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Publishing sends email notifications to all assigned volunteers.
        You can still manually adjust assignments after publishing.
      </p>
    </div>
  );
}
