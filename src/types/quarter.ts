export type QuarterStatus = 'setup' | 'preferences' | 'scheduled' | 'active' | 'closed';

export interface Quarter {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: QuarterStatus;
  swap_deadline_hours: number;
  created_at: string;
}
