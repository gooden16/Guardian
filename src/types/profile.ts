import type { VolunteerRole } from './shift';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: VolunteerRole;
  preferred_shift?: 'early' | 'late' | 'none';
  avatar_url?: string;
  is_admin: boolean;
  blackout_dates?: string[];       // ISO date strings
  partner_preferences?: string[];  // user UUIDs
  notification_assignments?: boolean;
  notification_changes?: boolean;
  notification_announcements?: boolean;
  onboarding_complete?: boolean;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'is_admin'>>;

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  preferred_shift?: 'early' | 'late' | 'none';
}

export interface NotificationPrefs {
  notification_assignments: boolean;
  notification_changes: boolean;
  notification_announcements: boolean;
}
