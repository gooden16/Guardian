import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateSchedulingPrefs, getAllProfiles } from '../lib/profiles';
import { getCurrentQuarter } from '../lib/quarters';
import { getQuarterShifts } from '../lib/shifts';
import { PreferencesCalendar, type ShiftDateOption } from '../components/PreferencesCalendar';
import { VolunteerSelector } from '../components/VolunteerSelector';
import type { Profile } from '../types/profile';
import type { Quarter } from '../types/quarter';

export function Preferences() {
  const { user } = useAuth();
  const [quarter, setQuarter] = useState<Quarter | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [allVolunteers, setAllVolunteers] = useState<Profile[]>([]);
  const [shiftDates, setShiftDates] = useState<ShiftDateOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [preferredShift, setPreferredShift] = useState<'early' | 'late' | 'none'>('none');
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [partnerIds, setPartnerIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserProfile(user.id),
      getCurrentQuarter(),
      getAllProfiles(),
    ]).then(async ([profile, q, volunteers]) => {
      setMyProfile(profile);
      setQuarter(q);
      setAllVolunteers(volunteers.filter((v) => v.id !== user.id));
      if (q) {
        const shifts = await getQuarterShifts(q.id);
        // One entry per day using early shifts, include event title
        const seen = new Set<string>();
        const dates: ShiftDateOption[] = [];
        for (const s of shifts.filter(s => s.type === 'early').sort((a, b) => a.date.localeCompare(b.date))) {
          if (!seen.has(s.date)) {
            seen.add(s.date);
            dates.push({ date: s.date, title: s.event_title ?? s.date });
          }
        }
        setShiftDates(dates);
      }
      if (profile) {
        setPreferredShift((profile.preferred_shift as 'early' | 'late' | 'none') ?? 'none');
        setBlackoutDates(profile.blackout_dates ?? []);
        setPartnerIds(profile.partner_preferences ?? []);
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateSchedulingPrefs(user.id, {
        preferred_shift: preferredShift,
        blackout_dates: blackoutDates,
        partner_preferences: partnerIds,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!quarter) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">No active quarter found. Check back soon.</p>
      </div>
    );
  }

  if (quarter.status !== 'preferences') {
    return (
      <div className="text-center py-20 space-y-2">
        <p className="text-gray-700 font-medium">Preferences are not open yet</p>
        <p className="text-sm text-gray-500">
          {quarter.status === 'setup'
            ? 'The admin is still setting up the quarter. Check back soon.'
            : 'The schedule for this quarter has already been generated.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduling preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          {quarter.name} — your preferences help us build the best schedule for everyone.
        </p>
      </div>

      {/* Shift preference */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Preferred shift time</h2>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'early', 'late'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setPreferredShift(option)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                preferredShift === option
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {option === 'none' ? 'No preference' : option === 'early' ? 'Early' : 'Late'}
            </button>
          ))}
        </div>
        {preferredShift !== 'none' && (
          <p className="text-xs text-gray-500">
            {preferredShift === 'early' ? 'Early: 8:35–10:10 AM' : 'Late: 10:20 AM–12:00 PM'}
          </p>
        )}
      </div>

      {/* Blackout dates */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Dates I can't volunteer</h2>
          <p className="text-xs text-gray-500 mt-0.5">Tap a date to mark it as unavailable (shown in red)</p>
        </div>
        <PreferencesCalendar
          selectedDates={blackoutDates}
          shiftDates={shiftDates}
          onChange={setBlackoutDates}
        />
      </div>

      {/* Partner preferences */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Preferred partners</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            We'll try to schedule you with these volunteers when possible (up to 4)
          </p>
        </div>
        <VolunteerSelector
          volunteers={allVolunteers}
          selectedIds={partnerIds}
          currentUserId={user?.id ?? ''}
          onChange={setPartnerIds}
          max={4}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Saved!
          </>
        ) : saving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save preferences
          </>
        )}
      </button>
    </div>
  );
}
