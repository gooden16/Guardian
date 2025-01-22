export const ShiftTime = {
  EARLY_MORNING: 'EARLY_MORNING',   // 8:35 AM - 10:20 AM
  LATE_MORNING: 'LATE_MORNING',     // 10:10 AM - 12:00 PM
  EVENING: 'EVENING'                // For holiday evening shifts
};

export const SHIFT_TIMES = {
  [ShiftTime.EARLY_MORNING]: {
    start: '08:35',
    end: '10:20'
  },
  [ShiftTime.LATE_MORNING]: {
    start: '10:10',
    end: '12:00'
  },
  [ShiftTime.EVENING]: {
    start: '18:30',     // Approximate time, should be adjusted based on sunset
    end: '20:00'
  }
};
