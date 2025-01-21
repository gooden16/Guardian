import { z } from 'zod';

export const TrainingLevel = {
  TEAM_LEADER: 'TEAM_LEADER',
  LEVEL_1: 'LEVEL_1',
  LEVEL_2: 'LEVEL_2'
};

export const volunteerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  trainingLevel: z.enum([TrainingLevel.TEAM_LEADER, TrainingLevel.LEVEL_1, TrainingLevel.LEVEL_2]),
  isActive: z.boolean().default(true),
  availability: z.array(z.string()),
  shiftsThisQuarter: z.number().default(0),
  lastShift: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const createVolunteer = (data) => {
  const result = volunteerSchema.safeParse({
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
};