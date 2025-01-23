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
}

function getCurrentQuarterDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Calculate quarter start month (0, 3, 6, 9)
  const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
  
  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = new Date(currentYear, quarterStartMonth + 3, 0); // Last day of quarter
  
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
    const { error } = await supabase
      .from('shift_assignments')
      .insert([{ shift_id: shiftId, user_id: userId }]);

    if (error) throw error;
  },

  async withdrawFromShift(shiftId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('shift_assignments')
      .delete()
      .match({ shift_id: shiftId, user_id: userId });

    if (error) throw error;
  },
};