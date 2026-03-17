export type VolunteerRole = 'TL' | 'L2' | 'L1';
export type AssignmentSource = 'auto' | 'manual' | 'self';
export type EventType = 'shabbat' | 'holiday' | 'evening';
export type ShiftStatus = 'draft' | 'published';

export interface Shift {
  id: string;
  date: string;
  type: 'early' | 'late';
  hebrew_parasha?: string;
  event_type?: EventType;
  event_title?: string;
  event_notes?: string;
  status: ShiftStatus;
  quarter_id?: string;
  volunteers: ShiftVolunteer[];
}

export interface ShiftVolunteer {
  id: string;
  user_id: string;
  role: VolunteerRole;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  assignment_source: AssignmentSource;
}

/** Groups early + late shifts for the same date into one logical event day */
export interface EventDay {
  date: string;
  event_title: string;
  event_notes?: string;
  event_type: EventType;
  hebrew_parasha?: string;
  early_shift?: Shift;
  late_shift?: Shift;
}
