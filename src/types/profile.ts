import type { VolunteerRole } from './shift';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: VolunteerRole;
  preferred_shift?: 'early' | 'late';
  avatar_url?: string;
  is_admin: boolean;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'is_admin'>>;

export interface ProfileFormData {
  role: VolunteerRole;
  first_name: string;
  last_name: string;
  phone?: string;
  preferred_shift?: 'early' | 'late';
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}