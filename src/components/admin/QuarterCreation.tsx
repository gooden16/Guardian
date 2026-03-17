import React, { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getUpcomingShabbatDates, parseQuarterName, type ShabbatDate } from '../../lib/hebcal';
import { createQuarter } from '../../lib/quarters';
import { supabase } from '../../lib/supabase';
import type { Quarter } from '../../types/quarter';
import type { EventType } from '../../types/shift';

interface DraftEvent {
  id: string;
  date: string;
  event_type: EventType;
  event_title: string;
  hebrew_parasha?: string;
  event_notes: string;
}

interface QuarterCreationProps {
  onCreated: (q: Quarter) => void;
}

export function QuarterCreation({ onCreated }: QuarterCreationProps) {
  const [step, setStep] = useState<'form' | 'events'>('form');
  const [quarterInput, setQuarterInput] = useState('');
  const [events, setEvents] = useState<DraftEvent[]>([]);
  const [loadingHebcal, setLoadingHebcal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Derived from quarterInput
  const parsed = parseQuarterName(quarterInput);

  const loadShabbatDates = async () => {
    if (!parsed) return;
    setLoadingHebcal(true);
    setError('');
    try {
      const shabbatDates: ShabbatDate[] = await getUpcomingShabbatDates(parsed.startDate, parsed.endDate);

      const draftEvents: DraftEvent[] = shabbatDates
        .filter((s) => s.date >= parsed.startDate && s.date <= parsed.endDate)
        .map((s) => ({
          id: crypto.randomUUID(),
          date: format(s.date, 'yyyy-MM-dd'),
          event_type: 'shabbat' as EventType,
          event_title: s.hebrew || `Parashat ${s.parasha}`,
          hebrew_parasha: s.hebrew,
          event_notes: '',
        }));

      setEvents(draftEvents);
    } catch {
      setError('Failed to load dates from HebCal. Check your connection and try again.');
    } finally {
      setLoadingHebcal(false);
    }
  };

  const addManualEvent = () => {
    setEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: parsed ? format(parsed.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        event_type: 'holiday',
        event_title: '',
        event_notes: '',
      },
    ]);
  };

  const updateEvent = (id: string, field: keyof DraftEvent, value: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = async () => {
    if (!parsed) {
      setError('Invalid quarter format. Use "Q2 2026".');
      return;
    }
    if (events.length === 0) {
      setError('Add at least one event before saving.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const startDate = format(parsed.startDate, 'yyyy-MM-dd');
      const endDate = format(parsed.endDate, 'yyyy-MM-dd');
      const quarter = await createQuarter({ name: parsed.name, start_date: startDate, end_date: endDate });

      const shiftRows = events.flatMap((ev) => [
        {
          date: ev.date,
          type: 'early',
          event_type: ev.event_type,
          event_title: ev.event_title,
          hebrew_parasha: ev.hebrew_parasha ?? null,
          event_notes: ev.event_notes || null,
          quarter_id: quarter.id,
          status: 'draft',
        },
        {
          date: ev.date,
          type: 'late',
          event_type: ev.event_type,
          event_title: ev.event_title,
          hebrew_parasha: ev.hebrew_parasha ?? null,
          event_notes: ev.event_notes || null,
          quarter_id: quarter.id,
          status: 'draft',
        },
      ]);

      const { error: insertErr } = await supabase.from('shifts').insert(shiftRows);
      if (insertErr) throw insertErr;

      onCreated(quarter);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save quarter');
    } finally {
      setSaving(false);
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (step === 'form') {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Create new quarter</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
          <input
            type="text"
            value={quarterInput}
            onChange={(e) => setQuarterInput(e.target.value)}
            placeholder="Q2 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {parsed && (
            <p className="mt-1 text-xs text-gray-500">
              {format(parsed.startDate, 'MMM d, yyyy')} — {format(parsed.endDate, 'MMM d, yyyy')}
            </p>
          )}
          {quarterInput && !parsed && (
            <p className="mt-1 text-xs text-red-500">Use format "Q2 2026"</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={() => { setStep('events'); loadShabbatDates(); }}
          disabled={!parsed}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Continue — Review events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Review events — {parsed?.name}
        </h3>
        <button
          onClick={addManualEvent}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add event
        </button>
      </div>

      {loadingHebcal && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dates from HebCal…
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedEvents.map((ev) => (
          <div key={ev.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={ev.date}
                    onChange={(e) => updateEvent(ev.id, 'date', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">Type</label>
                  <select
                    value={ev.event_type}
                    onChange={(e) => updateEvent(ev.id, 'event_type', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="shabbat">Shabbat</option>
                    <option value="holiday">Holiday</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => removeEvent(ev.id)}
                className="mt-4 text-gray-400 hover:text-red-500"
                aria-label="Remove event"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">Title</label>
              <input
                type="text"
                value={ev.event_title}
                onChange={(e) => updateEvent(ev.id, 'event_title', e.target.value)}
                placeholder="e.g. Parashat Vayera or Purim"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">Notes for volunteers (optional)</label>
              <input
                type="text"
                value={ev.event_notes}
                onChange={(e) => updateEvent(ev.id, 'event_notes', e.target.value)}
                placeholder="e.g. Bar mitzvah — expect larger crowd"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">{sortedEvents.length} events → {sortedEvents.length * 2} shifts (early + late each)</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setStep('form')}
          className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving || sortedEvents.length === 0}
          className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </span>
          ) : (
            `Save quarter (${sortedEvents.length} events)`
          )}
        </button>
      </div>
    </div>
  );
}
