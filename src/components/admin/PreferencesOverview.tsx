import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types/profile';
import { format, parseISO } from 'date-fns';

interface PreferencesOverviewProps {
  quarterId: string;
}

export function PreferencesOverview({ quarterId }: PreferencesOverviewProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('last_name')
      .then(({ data }) => {
        setProfiles(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Loading volunteers…</div>;
  }

  const submitted = profiles.filter(
    (p) => p.blackout_dates !== undefined || p.preferred_shift !== undefined
  );
  const notSubmitted = profiles.filter(
    (p) => !p.blackout_dates?.length && !p.preferred_shift
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-700 font-medium">{profiles.length} volunteers</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{submitted.length} have submitted preferences</span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {profiles.map((p, i) => {
          const hasPrefs = !!(p.blackout_dates?.length || p.preferred_shift);
          const isExpanded = expanded === p.id;

          return (
            <div key={p.id} className={`${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {hasPrefs ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300 shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {p.first_name} {p.last_name}
                    </span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                      ${p.role === 'TL' ? 'bg-purple-100 text-purple-700' :
                        p.role === 'L2' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'}`}>
                      {p.role}
                    </span>
                  </div>
                </div>
                {hasPrefs && (
                  isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isExpanded && hasPrefs && (
                <div className="px-11 pb-3 space-y-1.5 text-sm text-gray-600">
                  {p.preferred_shift && p.preferred_shift !== 'none' && (
                    <p>
                      <span className="font-medium">Prefers:</span>{' '}
                      {p.preferred_shift === 'early' ? 'Early shift' : 'Late shift'}
                    </p>
                  )}
                  {p.blackout_dates && p.blackout_dates.length > 0 && (
                    <p>
                      <span className="font-medium">Unavailable:</span>{' '}
                      {p.blackout_dates.map((d) => format(parseISO(d), 'MMM d')).join(', ')}
                    </p>
                  )}
                  {p.partner_preferences && p.partner_preferences.length > 0 && (
                    <p>
                      <span className="font-medium">Partner prefs:</span>{' '}
                      {p.partner_preferences.length} preference{p.partner_preferences.length !== 1 ? 's' : ''} set
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
