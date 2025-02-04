export type VolunteerRole = 'TL' | 'L2' | 'L1';

export interface Shift {
  id: string;
  date: string;
  type: 'early' | 'late';
  hebrew_parasha?: string;
  volunteers: ShiftVolunteer[];
  messages: ShiftMessage[];
}

export interface ShiftVolunteer {
  id: string;
  role: VolunteerRole;
  name: string;
}

export interface ShiftMessage {
  id: string;
  message: string;
  created_at: string;
  senderName: string;
}