export interface Database {
  public: {
    Tables: {
      shifts: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          total_slots: number;
          filled_slots: number;
          created_at: string;
          name: string;
          shift_type: 'Early' | 'Late' | 'Evening';
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          total_slots: number;
          filled_slots?: number;
          created_at?: string;
          name: string;
          shift_type: 'Early' | 'Late' | 'Evening';
        };
        Update: {
          id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          total_slots?: number;
          filled_slots?: number;
          created_at?: string;
          name?: string;
          shift_type?: 'Early' | 'Late' | 'Evening';
        };
      };
      shift_assignments: {
        Row: {
          id: string;
          shift_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}