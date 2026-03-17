import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, ProfileUpdate, NotificationPrefs } from '../types/profile';

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/** Creates a profile row for a brand-new OAuth user if one doesn't exist yet. */
export async function createUserProfile(user: User) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) return;

    // Try to extract name from OAuth metadata (Google/Apple)
    const meta = user.user_metadata ?? {};
    const fullName: string = meta.full_name || meta.name || '';
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || 'New';
    const lastName = parts.slice(1).join(' ') || 'User';

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      first_name: firstName,
      last_name: lastName,
      role: 'L1',
      is_admin: false,
      onboarding_complete: false,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
}

export async function updateUserProfile(userId: string, updates: ProfileUpdate): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateNotificationPrefs(userId: string, prefs: NotificationPrefs): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(prefs)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUserAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${userId}.${fileExt}`;

  const { data: existingFiles } = await supabase.storage.from('avatars').list(userId);
  const existingAvatar = existingFiles?.find(
    (f) => f.name.startsWith(`${userId}.`) && f.name !== '.emptyFolderPlaceholder'
  );
  if (existingAvatar) {
    await supabase.storage.from('avatars').remove([`${userId}/${existingAvatar.name}`]);
  }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { cacheControl: '3600', upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
  if (!publicUrl) throw new Error('Failed to get public URL for avatar');

  await updateUserProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
}

/** Save a volunteer's scheduling preferences */
export async function updateSchedulingPrefs(
  userId: string,
  prefs: {
    preferred_shift?: 'early' | 'late' | 'none';
    blackout_dates?: string[];
    partner_preferences?: string[];
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(prefs)
    .eq('id', userId);

  if (error) throw error;
}

/** Fetch all volunteer profiles (admin use) */
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('last_name');

  if (error) throw error;
  return data ?? [];
}
