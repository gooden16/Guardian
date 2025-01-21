import { addMinutes, format, parseISO } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { ShiftTime } from '../models/Shift';

const TIMEZONE = 'America/New_York';

export const SHIFT_TIMES = {
  [ShiftTime.EARLY]: {
    start: '08:35',
    end: '10:20'
  },
  [ShiftTime.LATE]: {
    start: '10:10',
    end: '12:00'
  }
};

export const formatShiftTime = (date, time) => {
  const shiftTime = SHIFT_TIMES[time];
  const [startHour, startMinute] = shiftTime.start.split(':');
  const [endHour, endMinute] = shiftTime.end.split(':');
  
  const start = zonedTimeToUtc(
    `${format(date, 'yyyy-MM-dd')}T${shiftTime.start}:00`,
    TIMEZONE
  );
  
  const end = zonedTimeToUtc(
    `${format(date, 'yyyy-MM-dd')}T${shiftTime.end}:00`,
    TIMEZONE
  );

  return {
    start,
    end,
    display: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`
  };
};

export const isShiftFull = (shift) => {
  const { assignments } = shift;
  return (
    assignments.teamLeader &&
    assignments.level1.length === 2 &&
    assignments.level2.length === 1
  );
};

export const canVolunteerJoinShift = (shift, volunteer, otherShifts) => {
  // Check if volunteer is already assigned to this shift
  const isAssigned = Object.values(shift.assignments).flat().includes(volunteer.id);
  if (isAssigned) return false;

  // Check if volunteer has reached their quarterly limit
  if (volunteer.shiftsThisQuarter >= getQuarterlyShiftLimit(volunteer.trainingLevel)) {
    return false;
  }

  // Check if volunteer is already assigned to another shift on the same day
  const shiftDate = format(shift.date, 'yyyy-MM-dd');
  const hasConflict = otherShifts.some(otherShift => {
    return format(otherShift.date, 'yyyy-MM-dd') === shiftDate;
  });

  return !hasConflict;
};

export const getQuarterlyShiftLimit = (trainingLevel) => {
  switch (trainingLevel) {
    case 'TEAM_LEADER':
      return 4; // 2 days, 2 shifts per day
    case 'LEVEL_1':
    case 'LEVEL_2':
      return 3;
    default:
      return 0;
  }
};