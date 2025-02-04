import { supabase } from './supabase';
import type { Shift } from '../types/shift';

export function formatDateForDB(dateStr: string): string {
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
  return data;
}

export async function withdrawFromShift(shiftId: string, reason: string): Promise<void> {
  const { error } = await supabase
    .rpc('withdraw_from_shift', {
      p_shift_id: shiftId,
      p_reason: reason
    });

  if (error) throw error;
}

export async function withdrawFromShifts(shiftIds: string[], reason: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to withdraw from shifts');
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

  // For Team Leaders, ensure they're withdrawing from both shifts
  if (userProfile.role === 'TL' && shiftIds.length !== 2) {
    throw new Error('Team Leaders must withdraw from both shifts');
  }

  // Call the withdraw function for each shift
  for (const shiftId of shiftIds) {
    const { error } = await supabase.rpc('withdraw_from_shift', {
      p_shift_id: shiftId,
      p_reason: reason
    });

    if (error) throw error;
  }
}
export async function getShifts(startDate: Date, endDate: Date): Promise<Shift[]> {
  try {
    // Format dates consistently for the query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    console.log('Querying shifts:', { formattedStartDate, formattedEndDate });

    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        date,
        type,
        hebrew_parasha,
        shift_volunteers!left (
          id,
          user_id,
          profiles!inner (
            first_name,
            last_name,
            role
          )
        ),
        shift_messages!left (
          id,
          message,
          created_at,
          user_id,
          profiles!inner (
            first_name,
            last_name
          )
        )
      `)
      .gte('date', formattedStartDate)
      .lte('date', formattedEndDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Failed to fetch shifts: ${error.message}`);
    }

    if (!data) {
      console.log('No shifts found for date range');
      return [];
    }

    // Transform the data
    return data.map(shift => ({
      id: shift.id,
      date: shift.date,
      type: shift.type,
      hebrew_parasha: shift.hebrew_parasha,
      volunteers: shift.shift_volunteers?.map(sv => ({
        id: sv.user_id,
        role: sv.profiles.role,
        name: `${sv.profiles.first_name} ${sv.profiles.last_name}`
      })) || [],
      messages: shift.shift_messages?.map(msg => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        senderName: `${msg.profiles.first_name} ${msg.profiles.last_name}`
      })) || []
    }));

  } catch (error) {
    console.error('Error in getShifts:', error);
    throw error;
  }
}

export async function getUserShifts(): Promise<Shift[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        date,
        type,
        hebrew_parasha,
        shift_volunteers!inner (
          id,
          user_id,
          profiles!inner (
            first_name,
            last_name,
            role
          )
        ),
        shift_messages!left (
          id,
          message,
          created_at,
          profiles!inner (
            first_name,
            last_name
          )
        )
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Failed to fetch user shifts: ${error.message}`);
    }

    if (!data) return [];

    const shifts = data.map(shift => ({
      id: shift.id,
      date: shift.date,
      type: shift.type,
      hebrew_parasha: shift.hebrew_parasha,
      volunteers: shift.shift_volunteers?.map(sv => ({
        id: sv.user_id,
        role: sv.profiles.role,
        name: `${sv.profiles.first_name} ${sv.profiles.last_name}`
      })) || [],
      messages: shift.shift_messages?.map(msg => ({
        id: msg.id,
        message: msg.message,
        created_at: msg.created_at,
        senderName: `${msg.profiles.first_name} ${msg.profiles.last_name}`
      })) || []
    }));

    // Filter shifts where the user is a volunteer
    return shifts.filter(shift => 
      shift.volunteers.some(volunteer => volunteer.id === user.id)
    );

  } catch (error) {
    console.error('Error in getUserShifts:', error);
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