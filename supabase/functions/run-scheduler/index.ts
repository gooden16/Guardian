/**
 * run-scheduler Edge Function
 *
 * Invoked by admin to generate a draft shift schedule for a quarter.
 * Reads volunteer preferences and constraints, runs a greedy assignment
 * algorithm, writes results back to shift_assignments, and records a
 * scheduler_runs summary row.
 *
 * POST /functions/v1/run-scheduler
 * Body: { quarter_id: string }
 * Auth: Bearer token of an admin user
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { quarter_id } = await req.json();
    if (!quarter_id) {
      return Response.json({ error: 'quarter_id required' }, { status: 400, headers: corsHeaders });
    }

    // ----------------------------------------------------------------
    // 1. Load quarter
    // ----------------------------------------------------------------
    const { data: quarter, error: qErr } = await supabase
      .from('quarters')
      .select('*')
      .eq('id', quarter_id)
      .single();

    if (qErr || !quarter) {
      return Response.json({ error: 'Quarter not found' }, { status: 404, headers: corsHeaders });
    }

    // ----------------------------------------------------------------
    // 2. Load all draft shifts for the quarter
    // ----------------------------------------------------------------
    const { data: shifts, error: sErr } = await supabase
      .from('shifts')
      .select('id, date, type')
      .eq('quarter_id', quarter_id)
      .eq('status', 'draft')
      .order('date')
      .order('type');

    if (sErr) throw sErr;
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'No draft shifts found for this quarter' }, { status: 400, headers: corsHeaders });
    }

    // ----------------------------------------------------------------
    // 3. Load all active volunteer profiles with preferences
    // ----------------------------------------------------------------
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, role, preferred_shift, blackout_dates, partner_preferences');

    if (pErr) throw pErr;
    const volunteers = profiles ?? [];

    // ----------------------------------------------------------------
    // 4. Load any existing manual assignments (lock these in)
    // ----------------------------------------------------------------
    const { data: manualAssignments, error: maErr } = await supabase
      .from('shift_assignments')
      .select('user_id, shift_id')
      .in('shift_id', shifts.map((s: any) => s.id))
      .eq('assignment_source', 'manual');

    if (maErr) throw maErr;

    // ----------------------------------------------------------------
    // 5. Build constraint model
    // ----------------------------------------------------------------
    interface VolConstraints {
      id: string;
      role: 'TL' | 'L2' | 'L1';
      preferredShift: 'early' | 'late' | 'none';
      blackoutDates: Set<string>;
      partnerPrefs: string[];
      quota: number;           // shifts to assign
      assignedShifts: string[]; // shift IDs
      assignedDates: Set<string>; // to prevent same-day double-booking (for non-TL)
    }

    const constraints = new Map<string, VolConstraints>();
    for (const v of volunteers) {
      const role = v.role as 'TL' | 'L2' | 'L1';
      constraints.set(v.id, {
        id: v.id,
        role,
        preferredShift: (v.preferred_shift ?? 'none') as 'early' | 'late' | 'none',
        blackoutDates: new Set<string>(v.blackout_dates ?? []),
        partnerPrefs: v.partner_preferences ?? [],
        quota: role === 'TL' ? 2 : 3, // TL: 2 full days, L1/L2: 3 shifts
        assignedShifts: [],
        assignedDates: new Set<string>(),
      });
    }

    // Lock in manual assignments
    for (const ma of manualAssignments ?? []) {
      const vc = constraints.get(ma.user_id);
      const shift = shifts.find((s: any) => s.id === ma.shift_id);
      if (vc && shift) {
        vc.assignedShifts.push(ma.shift_id);
        vc.assignedDates.add(shift.date);
      }
    }

    // ----------------------------------------------------------------
    // 6. Build slot model — group early+late by date
    // ----------------------------------------------------------------
    interface EventSlot {
      date: string;
      earlyShiftId: string;
      lateShiftId: string;
      assignedTL: string | null;
    }

    const eventSlots = new Map<string, EventSlot>();
    for (const s of shifts) {
      if (!eventSlots.has(s.date)) {
        eventSlots.set(s.date, {
          date: s.date,
          earlyShiftId: '',
          lateShiftId: '',
          assignedTL: null,
        });
      }
      const slot = eventSlots.get(s.date)!;
      if (s.type === 'early') slot.earlyShiftId = s.id;
      else slot.lateShiftId = s.id;
    }

    const sortedDates = Array.from(eventSlots.keys()).sort();

    // ----------------------------------------------------------------
    // 7. Assign TLs (scarcest resource — assign first)
    // ----------------------------------------------------------------
    const tlVolunteers = Array.from(constraints.values()).filter((v) => v.role === 'TL');
    const warnings: string[] = [];
    const newAssignments: { user_id: string; shift_id: string; assignment_source: string }[] = [];

    // Sort dates by fewest available TLs (hardest to fill first)
    const datesByTLAvailability = sortedDates.sort((a, b) => {
      const availA = tlVolunteers.filter((tl) => !tl.blackoutDates.has(a) && tl.assignedShifts.length < tl.quota * 2).length;
      const availB = tlVolunteers.filter((tl) => !tl.blackoutDates.has(b) && tl.assignedShifts.length < tl.quota * 2).length;
      return availA - availB;
    });

    for (const date of datesByTLAvailability) {
      const slot = eventSlots.get(date)!;

      // If a TL is already manually assigned to both shifts on this date, skip
      const manualTLEarly = (manualAssignments ?? []).find(
        (ma: any) => ma.shift_id === slot.earlyShiftId && constraints.get(ma.user_id)?.role === 'TL'
      );
      if (manualTLEarly) {
        slot.assignedTL = manualTLEarly.user_id;
        continue;
      }

      // Score each TL
      const scored = tlVolunteers
        .filter((tl) => {
          if (tl.blackoutDates.has(date)) return false;
          if (tl.assignedShifts.length >= tl.quota * 2) return false; // quota * 2 because TL does both shifts per day
          return true;
        })
        .map((tl) => {
          let score = 0;
          // Prefer spread of assignments across quarter
          score -= tl.assignedShifts.length * 5;
          return { tl, score };
        })
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) {
        warnings.push(`No TL available for ${date}`);
        continue;
      }

      const { tl } = scored[0];
      slot.assignedTL = tl.id;

      // Assign TL to both shifts on this date
      for (const shiftId of [slot.earlyShiftId, slot.lateShiftId]) {
        if (!shiftId) continue;
        tl.assignedShifts.push(shiftId);
        newAssignments.push({ user_id: tl.id, shift_id: shiftId, assignment_source: 'auto' });
      }
      tl.assignedDates.add(date);
    }

    // ----------------------------------------------------------------
    // 8. Assign L1/L2 volunteers to each shift
    // ----------------------------------------------------------------
    const l1l2Volunteers = Array.from(constraints.values()).filter(
      (v) => v.role === 'L1' || v.role === 'L2'
    );

    for (const date of sortedDates) {
      const slot = eventSlots.get(date)!;

      for (const { shiftId, shiftType } of [
        { shiftId: slot.earlyShiftId, shiftType: 'early' as const },
        { shiftId: slot.lateShiftId, shiftType: 'late' as const },
      ]) {
        if (!shiftId) continue;

        // Count how many already assigned (manual)
        const alreadyAssigned = new Set(
          (manualAssignments ?? [])
            .filter((ma: any) => ma.shift_id === shiftId)
            .map((ma: any) => ma.user_id)
        );
        if (slot.assignedTL) alreadyAssigned.add(slot.assignedTL); // TL counts

        const target = 4; // target volunteers per shift (including TL)

        const scored = l1l2Volunteers
          .filter((v) => {
            if (v.blackoutDates.has(date)) return false;
            if (v.assignedShifts.length >= v.quota) return false;
            if (alreadyAssigned.has(v.id)) return false;
            // Don't assign L1/L2 to both shifts on the same day
            if (v.assignedDates.has(date)) return false;
            return true;
          })
          .map((v) => {
            let score = 0;
            // Prefer matching shift preference
            if (v.preferredShift === shiftType) score += 10;
            else if (v.preferredShift !== 'none') score -= 5;
            // Prefer partner preferences overlap with already-assigned volunteers
            const alreadyIds = Array.from(alreadyAssigned);
            const partnerMatches = alreadyIds.filter((id) => v.partnerPrefs.includes(id)).length;
            score += partnerMatches * 8;
            // Spread workload — prefer those with fewer assignments
            score -= v.assignedShifts.length * 3;
            return { v, score };
          })
          .sort((a, b) => b.score - a.score);

        const needed = target - alreadyAssigned.size;
        for (let i = 0; i < Math.min(needed, scored.length); i++) {
          const { v } = scored[i];
          v.assignedShifts.push(shiftId);
          v.assignedDates.add(date);
          alreadyAssigned.add(v.id);
          newAssignments.push({ user_id: v.id, shift_id: shiftId, assignment_source: 'auto' });
        }

        if (alreadyAssigned.size < 3) {
          warnings.push(`Shift ${shiftId} (${date} ${shiftType}) has only ${alreadyAssigned.size} volunteer(s)`);
        }
      }
    }

    // ----------------------------------------------------------------
    // 9. Quota check — try to place unassigned volunteers
    // ----------------------------------------------------------------
    const unassigned = Array.from(constraints.values()).filter(
      (v) => v.assignedShifts.length === 0
    );
    for (const v of unassigned) {
      warnings.push(`Volunteer ${v.id} (${v.role}) has no assignments — could not fit in schedule`);
    }

    // ----------------------------------------------------------------
    // 10. Write results to DB
    // ----------------------------------------------------------------

    // Clear previous auto assignments for this quarter
    const allShiftIds = shifts.map((s: any) => s.id);
    const { error: delErr } = await supabase
      .from('shift_assignments')
      .delete()
      .in('shift_id', allShiftIds)
      .eq('assignment_source', 'auto');

    if (delErr) throw delErr;

    // Insert new assignments
    if (newAssignments.length > 0) {
      const { error: insErr } = await supabase
        .from('shift_assignments')
        .insert(newAssignments);
      if (insErr) throw insErr;
    }

    // Record scheduler run
    const summary = {
      assigned: newAssignments.length,
      warnings,
      tl_gaps: warnings.filter((w) => w.includes('No TL')).length,
      understaffed_shifts: warnings.filter((w) => w.includes('only')).length,
    };

    const { data: runRow } = await supabase
      .from('scheduler_runs')
      .insert({
        quarter_id,
        status: 'completed',
        result_summary: summary,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Advance quarter to 'scheduled' if it was in 'preferences'
    if (quarter.status === 'preferences') {
      await supabase
        .from('quarters')
        .update({ status: 'scheduled' })
        .eq('id', quarter_id);
    }

    return Response.json(
      { success: true, run_id: runRow?.id, summary },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Scheduler error:', err);
    return Response.json(
      { error: err.message ?? 'Unexpected error' },
      { status: 500, headers: corsHeaders }
    );
  }
});
