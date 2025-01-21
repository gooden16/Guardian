import { Shift, User, ShiftRequirement } from '../types';
import { logger } from '../utils/logger';
import { getQuarterDates } from '../utils/date';

export class ShiftManager {
  private static instance: ShiftManager;
  private shifts: Map<string, Shift> = new Map();
  private requirements: ShiftRequirement = {
    teamLeader: 1,
    l1: 2,
    l2: 1
  };

  private constructor() {}

  static getInstance(): ShiftManager {
    if (!ShiftManager.instance) {
      ShiftManager.instance = new ShiftManager();
    }
    return ShiftManager.instance;
  }

  // Get all shifts for the current quarter
  async getQuarterlyShifts(): Promise<Shift[]> {
    try {
      const { start, end } = getQuarterDates();
      return Array.from(this.shifts.values()).filter(shift => 
        shift.date >= start && shift.date <= end
      );
    } catch (error) {
      logger.error('Failed to get quarterly shifts', error);
      throw new Error('Failed to retrieve shifts');
    }
  }

  // Get shifts for a specific volunteer
  async getVolunteerShifts(userId: string): Promise<Shift[]> {
    try {
      return Array.from(this.shifts.values()).filter(shift => 
        shift.teamLeader?.id === userId ||
        shift.l1Volunteers.some(v => v.id === userId) ||
        shift.l2Volunteer?.id === userId
      );
    } catch (error) {
      logger.error('Failed to get volunteer shifts', { error, userId });
      throw new Error('Failed to retrieve volunteer shifts');
    }
  }

  // Sign up for a shift
  async signUpForShift(shiftId: string, user: User): Promise<void> {
    try {
      const shift = this.shifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      // Check if user is already signed up
      if (
        shift.teamLeader?.id === user.id ||
        shift.l1Volunteers.some(v => v.id === user.id) ||
        shift.l2Volunteer?.id === user.id
      ) {
        throw new Error('Already signed up for this shift');
      }

      // Assign based on role and availability
      switch (user.role) {
        case 'TEAM_LEADER':
          if (shift.teamLeader) {
            throw new Error('Team Leader position already filled');
          }
          shift.teamLeader = user;
          break;
        case 'L1':
          if (shift.l1Volunteers.length >= this.requirements.l1) {
            throw new Error('L1 positions already filled');
          }
          shift.l1Volunteers.push(user);
          break;
        case 'L2':
          if (shift.l2Volunteer) {
            throw new Error('L2 position already filled');
          }
          shift.l2Volunteer = user;
          break;
        default:
          throw new Error('Invalid role for shift signup');
      }

      // Update shift status
      this.updateShiftStatus(shift);
      this.shifts.set(shiftId, shift);
      
      logger.info('Successfully signed up for shift', { shiftId, userId: user.id });
    } catch (error) {
      logger.error('Failed to sign up for shift', { error, shiftId, userId: user.id });
      throw error;
    }
  }

  // Request coverage for a shift
  async requestCoverage(shiftId: string, userId: string, reason: string): Promise<void> {
    try {
      const shift = this.shifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      // Verify user is assigned to shift
      if (
        shift.teamLeader?.id !== userId &&
        !shift.l1Volunteers.some(v => v.id === userId) &&
        shift.l2Volunteer?.id !== userId
      ) {
        throw new Error('User not assigned to this shift');
      }

      shift.status = 'NEEDS_COVERAGE';
      shift.notes = `Coverage needed: ${reason}`;
      this.shifts.set(shiftId, shift);

      logger.info('Coverage requested for shift', { shiftId, userId, reason });
    } catch (error) {
      logger.error('Failed to request coverage', { error, shiftId, userId });
      throw error;
    }
  }

  // Create a new shift
  async createShift(shift: Omit<Shift, 'id' | 'status'>): Promise<Shift> {
    try {
      const newShift: Shift = {
        ...shift,
        id: crypto.randomUUID(),
        status: 'OPEN',
        l1Volunteers: shift.l1Volunteers || []
      };

      this.shifts.set(newShift.id, newShift);
      logger.info('Created new shift', { shiftId: newShift.id });
      return newShift;
    } catch (error) {
      logger.error('Failed to create shift', error);
      throw new Error('Failed to create shift');
    }
  }

  // Cancel a shift signup
  async cancelShiftSignup(shiftId: string, userId: string): Promise<void> {
    try {
      const shift = this.shifts.get(shiftId);
      if (!shift) {
        throw new Error('Shift not found');
      }

      if (shift.teamLeader?.id === userId) {
        shift.teamLeader = undefined;
      } else if (shift.l2Volunteer?.id === userId) {
        shift.l2Volunteer = undefined;
      } else {
        shift.l1Volunteers = shift.l1Volunteers.filter(v => v.id !== userId);
      }

      this.updateShiftStatus(shift);
      this.shifts.set(shiftId, shift);
      
      logger.info('Successfully cancelled shift signup', { shiftId, userId });
    } catch (error) {
      logger.error('Failed to cancel shift signup', { error, shiftId, userId });
      throw error;
    }
  }

  private updateShiftStatus(shift: Shift): void {
    const isFullyStaffed = 
      shift.teamLeader &&
      shift.l1Volunteers.length === this.requirements.l1 &&
      shift.l2Volunteer;

    shift.status = isFullyStaffed ? 'FILLED' : 'OPEN';
  }
}