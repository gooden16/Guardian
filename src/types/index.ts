export type Role = 'ADMIN' | 'TEAM_LEADER' | 'L1' | 'L2';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneNumber: string;
  isActive: boolean;
  profileUrl?: string;
  quarterlyCommitment: {
    required: number;
    completed: number;
  };
}

export interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'EARLY' | 'LATE';
  assignments: {
    teamLeader?: string; // User ID
    l1Volunteers: string[]; // User IDs
    l2Volunteer?: string; // User ID
  };
  status: 'OPEN' | 'FILLED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface ShiftRequest {
  id: string;
  userId: string;
  shiftId: string;
  type: 'SWAP' | 'COVERAGE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'SHIFT_REMINDER' | 'SHIFT_CHANGE' | 'ANNOUNCEMENT' | 'REQUEST';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface VolunteerAvailability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface JewishHoliday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  id: string;
  shiftId: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerStats {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  totalShifts: number;
  quarterlyShifts: number;
  yearlyShifts: number;
}