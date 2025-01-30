export type VolunteerRole = 'TL' | 'L2' | 'L1';

export interface Shift {
  id: string;
  date: string;
  type: 'early' | 'late';
  volunteers: ShiftVolunteer[];
}

export interface ShiftVolunteer {
  id: string;
  role: VolunteerRole;
  name: string;
}