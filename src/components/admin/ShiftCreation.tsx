import React, { useState } from 'react';
import { format, addMonths, parseISO } from 'date-fns';
import { Calendar, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HebCalEvent {
  title: string;
  date: string;
  category: string;
  hebrew: string;
  memo?: string;
}

interface PreviewData {
  date: string;
  title: string;
  hebrew: string;
  candleLighting?: string;
  selected: boolean;
  shifts: {
    early: boolean;
    late: boolean;
    evening: boolean;
  };
}

interface ShiftCreationProps {
  onSuccess: () => void;
}

export function ShiftCreation({ onSuccess }: ShiftCreationProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const fetchHebCalData = async (start: string, end: string) => {
    const params = new URLSearchParams({
      cfg: 'json',
      start: start,
      end: end,
      year: new Date(start).getFullYear().toString(),
      maj: 'on',
      min: 'on',
      mod: 'on',
      nx: 'on',
      mf: 'on',
      ss: 'on',
      s: 'on',
      geo: 'zip',
      zip: '10463',
      i: 'off',
      b: 'off'
    });

    const response = await fetch(`https://www.hebcal.com/hebcal?${params}`);
    if (!response.ok) throw new Error('Failed to fetch HebCal data');
    const data = await response.json();
    console.log('HebCal response:', data); // Debug log
    return data.items as HebCalEvent[];
  };

  const handlePreviewShifts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data at once for the date range
      const events = await fetchHebCalData(startDate, endDate);
      
      // Filter for Shabbat and Yom Tov
      const relevantDates = events.filter(event => 
        event.category === 'parashat' ||
        (event.category === 'holiday' && event.title.match(/^(Pesach|Shavuot|Rosh Hashana|Yom Kippur|Sukkot|Shmini Atzeret|Simchat Torah)/i)) ||
        event.category === 'candles'
      );
      
      console.log('Relevant dates:', relevantDates); // Debug log

      // Group events by date and create preview data
      const preview: PreviewData[] = [];
      const dateGroups = relevantDates.reduce((acc, event) => {
        const date = event.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(event);
        return acc;
      }, {} as Record<string, HebCalEvent[]>);

      for (const [date, events] of Object.entries(dateGroups)) {
        const mainEvent = events.find(e => e.category === 'parashat' || e.category === 'holiday');
        const candleLightingEvent = events.find(e => e.category === 'candles' && e.title.includes('Candle lighting'));
        
        console.log('Processing date:', date, {mainEvent, candleLightingEvent}); // Debug log
        
        if (mainEvent) {
          const candleTime = candleLightingEvent?.title.match(/\d{1,2}:\d{2}(?:pm|am)/i)?.[0] || '';
          preview.push({
            date,
            title: mainEvent?.title || '',
            hebrew: mainEvent?.hebrew || '',
            candleLighting: candleTime,
            selected: true,
            shifts: {
              early: true,
              late: true,
              evening: !!candleTime
            }
          });
        }
      }

      setPreviewData(preview.sort((a, b) => a.date.localeCompare(b.date)));
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HebCal data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShifts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create shifts in batches to avoid overwhelming the database
      const selectedDates = previewData.filter(d => d.selected).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      
      const shiftsToCreate = selectedDates.flatMap(dateInfo => {
        const { date, hebrew, shifts } = dateInfo;
        const shiftList = [];

        if (shifts.early) {
          shiftList.push({
            date,
            type: 'early',
            hebrew_parasha: hebrew
          });
        }

        if (shifts.late) {
          shiftList.push({
            date,
            type: 'late',
            hebrew_parasha: hebrew
          });
        }

        if (shifts.evening) {
          shiftList.push({
            date,
            type: 'evening',
            hebrew_parasha: hebrew
          });
        }

        return shiftList;
      });

      // Insert all shifts at once
      if (shiftsToCreate.length > 0) {
        const { error: insertError } = await supabase
        .from('shifts')
        .upsert(shiftsToCreate, {
          onConflict: 'date,type',
          ignoreDuplicates: true
        });

        if (insertError) {
          console.error('Error inserting shifts:', insertError);
          throw new Error('Failed to create shifts');
        }
      }

      onSuccess();
      setShowPreview(false);
      setPreviewData([]);
    } catch (err) {
      console.error('Error creating shifts:', err);
      setError(err instanceof Error ? err.message : 'Failed to create shifts');
    } finally {
      setLoading(false);
    }
  };

  const toggleAllDates = (selected: boolean) => {
    setPreviewData(prev => prev.map(d => ({ ...d, selected })));
  };

  const toggleDate = (date: string) => {
    setPreviewData(prev => 
      prev.map(d => d.date === date ? { ...d, selected: !d.selected } : d)
    );
  };

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Create Shifts from HebCal
        </h3>
        
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            {showPreview ? (
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateShifts}
                  disabled={loading || previewData.filter(d => d.selected).length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Creating Shifts...
                    </>
                  ) : (
                    <>
                      <Calendar className="-ml-1 mr-2 h-4 w-4" />
                      Create Selected Shifts
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handlePreviewShifts}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Calendar className="-ml-1 mr-2 h-4 w-4" />
                    Preview Dates
                  </>
                )}
              </button>
            )}
          </div>

          {showPreview && previewData.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900">Preview Dates</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => toggleAllDates(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleAllDates(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="mt-2 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Select</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Hebrew</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Candle Lighting</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Shifts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {previewData.map(data => (
                          <PreviewRow
                            key={data.date}
                            data={data}
                            onToggle={() => toggleDate(data.date)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ data, onToggle }: { data: PreviewData; onToggle: () => void }) {
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <button
          onClick={onToggle}
          className={`p-1 rounded-full ${
            data.selected 
              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
              : 'text-gray-400 bg-gray-50 hover:bg-gray-100'
          }`}
        >
          {data.selected ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </button>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
        {format(parseISO(data.date), 'MMMM d, yyyy')}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {data.title}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-hebrew" dir="rtl" lang="he">
        {data.hebrew}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {data.candleLighting || '-'}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.shifts?.early}
              onChange={() => {
                const newData = { ...data };
                newData.shifts.early = !newData.shifts.early;
                onToggle();
              }}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-xs text-gray-600">Early</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.shifts?.late}
              onChange={() => {
                const newData = { ...data };
                newData.shifts.late = !newData.shifts.late;
                onToggle();
              }}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-xs text-gray-600">Late</span>
          </label>
          {data.candleLighting && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.shifts?.evening}
                onChange={() => {
                  const newData = { ...data };
                  newData.shifts.evening = !newData.shifts.evening;
                  onToggle();
                }}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-xs text-gray-600">Evening</span>
            </label>
          )}
        </div>
      </td>
    </tr>
  );
}