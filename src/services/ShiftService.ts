import { supabase } from '../lib/supabase';

export interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_slots: number;
  created_at: string;
  name: string;
  shift_type: 'Early' | 'Late' | 'Evening';
  required_tl: number;
  required_l1: number;
  required_l2: number;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  user_id: string;
  created_at: string;
  withdrawal_reason?: string;
  role: 'TL' | 'L1' | 'L2';
}

export interface ShiftWithCounts extends Shift {
  filled_slots: number;
  filled_tl: number;
  filled_l1: number;
  filled_l2: number;
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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error('Failed to get user profile');

    const { error: insertError } = await supabase
      .from('shift_assignments')
      .insert([{ shift_id: shiftId, user_id: userId, role: profile.role }]);

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('You are already signed up for this shift');
      }
      throw new Error('Failed to sign up for shift');
    }
  },

  async withdrawFromShift(shiftId: string, userId: string, reason: string): Promise<void> {
    try {
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

  async getShiftWithCounts(shiftId: string): Promise<ShiftWithCounts> {
    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', shiftId)
      .single();

    if (shiftError) throw shiftError;

    const { data: countsData, error: countsError } = await supabase.rpc('get_shift_counts', {
      shift_id: shiftId,
    }).single();

    if (countsError) throw countsError;

    return {
      ...shift,
      filled_slots: countsData?.filled_slots || 0,
      filled_tl: countsData?.filled_tl || 0,
      filled_l1: countsData?.filled_l1 || 0,
      filled_l2: countsData?.filled_l2 || 0,
    };
  },
};
