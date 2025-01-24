import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Role = 'TL' | 'L1' | 'L2';

export const ProfileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();

      if (!error && profile) {
        return profile;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User not found');
      }

      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userData.user.email!,
          role: 'L1' as const,
          first_name: '',
          last_name: '',
          phone_number: null,
        }, {
          onConflict: 'id',
          ignoreDuplicates: true,
        })
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error('Failed to upsert profile:', upsertError);
        const { data: finalProfile, error: finalError } = await supabase
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle();

        if (finalError || !finalProfile) {
          throw finalError || new Error('Failed to get or create profile');
        }
        return finalProfile;
      }

      return upsertedProfile;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async updateRole(userId: string, role: Role): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update role:', error);
      throw error;
    }
  },

  async updateName(userId: string, firstName: string, lastName: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update name:', error);
      throw error;
    }
  },

  async updatePhone(userId: string, phoneNumber: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ phone_number: phoneNumber })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update phone number:', error);
      throw error;
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      throw updateError;
    }

    return publicUrl;
  },

  async isAdmin(userId: string): Promise<boolean> {
    const adminUsers = ['your-admin-user-id'];
    return adminUsers.includes(userId);
  },

  async getQuarterlyStats(userId: string): Promise<{
    totalShifts: number;
    shabbatotCount: number;
  }> {
    const { startDate, endDate } = getCurrentQuarterDates();
    
    const { data: assignments, error } = await supabase
      .from('shift_assignments')
      .select('shift_id, shifts!inner(date, shift_type)')
      .eq('user_id', userId)
      .gte('shifts.date', startDate)
      .lte('shifts.date', endDate);

    if (error) {
      console.error('Failed to get quarterly stats:', error);
      throw error;
    }

    const shabbatDates = new Set();
    let totalShifts = 0;

    assignments?.forEach((assignment) => {
      const shift = assignment.shifts as any;
      if (shift.shift_type === 'Early' || shift.shift_type === 'Late') {
        shabbatDates.add(shift.date);
      }
      totalShifts++;
    });

    return {
      totalShifts,
      shabbatotCount: shabbatDates.size,
    };
  },

  async getTotalCompletedShifts(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('shift_assignments')
      .select('shift_id, shifts!inner(date)')
      .eq('user_id', userId)
      .lt('shifts.date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('Failed to get total completed shifts:', error);
      throw error;
    }

    return data?.length || 0;
  },
};

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
