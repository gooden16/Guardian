import { z } from 'zod';
import { TrainingLevel } from './Volunteer';

export const ShiftTime = {
  EARLY: 'EARLY', // 8:35 AM - 10:20 AM
  LATE: 'LATE'    // 10:10 AM - 12:00 PM
};

export const shiftSchema = z.object({
  id: z.string().uuid(),
  date: z.date(),
  time: z.enum([ShiftTime.EARLY, ShiftTime.LATE]),
  assignments: z.object({
    teamLeader: z.string().uuid().optional(),
    level1: z.array(z.string().uuid()).max(2),
    level2: z.array(z.string().uuid()).max(1)
  }),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const createShift = (data) => {
  const result = shiftSchema.safeParse({
    id: crypto.randomUUID(),
    ...data,
    assignments: {
      level1: [],
      level2: [],
      ...data.assignments
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
};