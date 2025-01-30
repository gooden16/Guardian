import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, ProfileUpdate, VolunteerRole } from '../types/profile';

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone,
      role,
      preferred_shift,
      avatar_url,
      is_admin
    `)
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return profile;
}

export async function createUserProfile(user: User) {
  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) return; // Profile already exists

    // Create new profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        first_name: 'New',
        last_name: 'User',
        role: 'L1', // Start as Level 1
        is_admin: false
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
}

export async function requestRoleChange(newRole: VolunteerRole): Promise<string> {
  const { data, error } = await supabase
    .rpc('request_role_change', {
      requested_role: newRole
    });

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId: string, updates: ProfileUpdate): Promise<void> {
  // If role is being updated, create a role change request instead
  if (updates.role) {
    await requestRoleChange(updates.role);
    // Remove role from updates to prevent direct update
    const { role, ...otherUpdates } = updates;
    updates = otherUpdates;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export async function updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}

export async function updateUserAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  await updateUserProfile(userId, { avatar_url: publicUrl });

  return publicUrl;
}