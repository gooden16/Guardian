import { supabase } from './supabase';
import type { Shift, ShiftVolunteer } from '../types/shift';

export function formatDateForDB(dateStr: string): string {
  // Ensure date is in YYYY-MM-DD format
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

async function ensureShiftsExist(startDate: Date, endDate: Date): Promise<void> {
  const { data, error } = await supabase
    .rpc('ensure_shifts_exist', {
      start_date: formatDateForDB(startDate.toISOString()),
      end_date: formatDateForDB(endDate.toISOString())
    });

  if (error) throw error;
}

export async function getUserShifts(): Promise<Shift[]> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];

  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      id,
      date,
      type,
      hebrew_parasha,
      shift_volunteers (
        id,
        user_id,
        profiles:user_id (
          first_name,
          last_name,
          role
        )
      ),
      shift_messages (
        id,
        message,
        created_at,
        profiles:user_id (
          first_name,
          last_name
        )
      )
    `)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  if (!shifts) return [];

  return shifts
    .map(shift => ({
      id: shift.id,
      date: shift.date,
      type: shift.type,
      hebrew_parasha: shift.hebrew_parasha,
      volunteers: (shift.shift_volunteers || []).map((sv: any) => ({
        id: sv.user_id,
        role: sv.profiles.role,
        name: `${sv.profiles.first_name} ${sv.profiles.last_name}`
      })),
      messages: (shift.shift_messages || []).map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        senderName: `${msg.profiles.first_name} ${msg.profiles.last_name}`
      }))
    }))
    .filter(shift => shift.volunteers.some(v => v.id === user.id));
}
export async function getShifts(startDate: Date, endDate: Date): Promise<Shift[]> {
  try {
    // First ensure shifts exist for the date range
    await supabase
      .rpc('ensure_shifts_exist', {
        start_date: formatDateForDB(startDate.toISOString()),
        end_date: formatDateForDB(endDate.toISOString())
      });

    const { data: shifts, error: shiftsError } = await supabase
      .from('shifts')
      .select(`
        id,
        date,
        type,
        hebrew_parasha,
        shift_volunteers (
          id,
          user_id,
          profiles:user_id (
            first_name,
            last_name,
            role
          )
        ),
        shift_messages (
          id,
          message,
          created_at,
          profiles:user_id (
            first_name,
            last_name
          )
        )
      `)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (shiftsError) {
      console.error('Error fetching shifts:', shiftsError);
      throw new Error('Failed to load shifts');
    }

    if (!shifts) return [];

    return shifts.map(shift => ({
      id: shift.id,
      date: shift.date,
      type: shift.type,
      hebrew_parasha: shift.hebrew_parasha,
      volunteers: (shift.shift_volunteers || []).map((sv: any) => ({
        id: sv.user_id,
        role: sv.profiles.role,
        name: `${sv.profiles.first_name} ${sv.profiles.last_name}`
      })),
      messages: (shift.shift_messages || []).map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        senderName: `${msg.profiles.first_name} ${msg.profiles.last_name}`
      }))
    }));

  } catch (error) {
    console.error('Error in getShifts:', error);
    throw error;
  }
}

export async function signUpForShift(shiftId: string, otherShiftId?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to sign up for shifts');
  }

  // Get user's role
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    throw new Error('User profile not found');
  }
  
  // Handle Team Leader signups differently
  if (userProfile.role === 'TL') {
    if (!otherShiftId) {
      throw new Error('Team Leaders must sign up for both shifts');
    }
    
    // Use the special function for Team Leader signups
    const { error } = await supabase
      .rpc('handle_team_leader_signup', {
        shift_id_1: shiftId,
        shift_id_2: otherShiftId
      });

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
  } else {
    // Regular volunteer signup
    // Check if already signed up
    const { data: existing } = await supabase
      .from('shift_volunteers')
      .select('id')
      .eq('shift_id', shiftId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      throw new Error('You are already signed up for this shift');
    }

    // Check if shift exists and is not full
    const { data: shift } = await supabase
      .from('shifts')
      .select('id')
      .eq('id', shiftId)
      .single();

    if (!shift) {
      throw new Error('This shift is no longer available');
    }

    const { count } = await supabase
      .from('shift_volunteers')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', shiftId);

    if (count && count >= 4) {
      throw new Error('This shift is already full');
    }

    // Insert single shift signup
    const { error } = await supabase
      .from('shift_volunteers')
      .insert([{
        shift_id: shiftId,
        user_id: user.id
      }]);

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }
}