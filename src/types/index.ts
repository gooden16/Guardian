export type Role = 'ADMIN' | 'TEAM_LEADER' | 'L1' | 'L2';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string;
  active: boolean;
  joinDate: Date;
  lastActive: Date;
}

export interface Shift {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  teamLeader?: User;
  l1Volunteers: User[];
  l2Volunteer?: User;
  notes?: string;
  status: 'OPEN' | 'FILLED' | 'NEEDS_COVERAGE';
}

export interface ShiftRequirement {
  teamLeader: number;
  l1: number;
  l2: number;
}