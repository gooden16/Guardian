import { supabase } from '../lib/supabase';

export interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  filled_slots: number;
  created_at: string;
  name: string;
  shift_type: 'Early' | 'Late' | 'Evening';
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  user_id: string;
  created_at: string;
  withdrawal_reason?: string;
}

function getCurrentQuarterDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
  
  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterStartMonth + 3, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export const ShiftService = {
  async getShifts(showAllShifts = false): Promise<Shift[]> {
    const today = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('shifts')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (!showAllShifts) {
      const { startDate, endDate } = getCurrentQuarterDates();
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  async getUserShifts(userId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shift_assignments')
      .select('shift_id, shifts!inner(*)')
      .eq('user_id', userId)
      .gte('shifts.date', new Date().toISOString().split('T')[0]);

    if (error) throw error;
    return data.map((item) => item.shifts as Shift);
  },

  async signUpForShift(shiftId: string, userId: string): Promise<void> {
    // First, get user's role and the shift details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error('Failed to get user profile');

    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (shiftError) throw new Error('Failed to get shift details');

    // For TLs, handle both shifts at once
    if (profile.role === 'TL' && (shift.shift_type === 'Early' || shift.shift_type === 'Late')) {
      // Find both Early and Late shifts for this date
      const { data: bothShifts, error: bothShiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', shift.date)
        .in('shift_type', ['Early', 'Late']);

      if (bothShiftsError || !bothShifts || bothShifts.length !== 2) {
        throw new Error('Could not find both Early and Late shifts for this date');
      }

      // Insert both shift assignments
      const { error: insertError } = await supabase
        .from('shift_assignments')
        .insert(
          bothShifts.map(s => ({
            shift_id: s.id,
            user_id: userId
          }))
        );

      if (insertError) {
        if (insertError.code === '23505') { // Unique violation
          throw new Error('You are already signed up for one or both shifts');
        }
        throw new Error('Failed to sign up for shifts');
      }
      return;
    }

    // For non-TLs or evening shifts, just insert the single assignment
    const { error } = await supabase
      .from('shift_assignments')
      .insert([{ shift_id: shiftId, user_id: userId }]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('You are already signed up for this shift');
      }
      throw new Error('Failed to sign up for shift');
    }
  },

  async withdrawFromShift(shiftId: string, userId: string, reason: string): Promise<void> {
    try {
      // First, get user's role and the shift details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) throw new Error('Failed to get user profile');

      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('id', shiftId)
        .single();

      if (shiftError) throw new Error('Failed to get shift details');

      // For TLs, withdraw from both shifts at once
      if (profile.role === 'TL' && (shift.shift_type === 'Early' || shift.shift_type === 'Late')) {
        // Find both shifts for this date
        const { data: bothShifts, error: bothShiftsError } = await supabase
          .from('shifts')
          .select('*')
          .eq('date', shift.date)
          .in('shift_type', ['Early', 'Late']);

        if (bothShiftsError || !bothShifts || bothShifts.length !== 2) {
          throw new Error('Could not find both shifts for withdrawal');
        }

        // Update withdrawal reason and delete both assignments
        const { error: deleteError } = await supabase
          .from('shift_assignments')
          .update({ withdrawal_reason: reason })
          .in('shift_id', bothShifts.map(s => s.id))
          .eq('user_id', userId)
          .then(() => supabase
            .from('shift_assignments')
            .delete()
            .in('shift_id', bothShifts.map(s => s.id))
            .eq('user_id', userId)
          );

        if (deleteError) throw new Error('Failed to withdraw from shifts');
        return;
      }

      // For non-TLs or evening shifts, just update and delete the single assignment
      const { error: updateError } = await supabase
        .from('shift_assignments')
        .update({ withdrawal_reason: reason })
        .eq('shift_id', shiftId)
        .eq('user_id', userId)
        .then(() => supabase
          .from('shift_assignments')
          .delete()
          .eq('shift_id', shiftId)
          .eq('user_id', userId)
        );

      if (updateError) throw new Error('Failed to withdraw from shift');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  },
};