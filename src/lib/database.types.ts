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
          required_tl: number;
          required_l1: number;
          required_l2: number;
          filled_tl: number;
          filled_l1: number;
          filled_l2: number;
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
          required_tl?: number;
          required_l1?: number;
          required_l2?: number;
          filled_tl?: number;
          filled_l1?: number;
          filled_l2?: number;
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
          required_tl?: number;
          required_l1?: number;
          required_l2?: number;
          filled_tl?: number;
          filled_l1?: number;
          filled_l2?: number;
        };
      };
      shift_assignments: {
        Row: {
          id: string;
          shift_id: string;
          user_id: string;
          created_at: string;
          role: 'TL' | 'L1' | 'L2';
        };
        Insert: {
          id?: string;
          shift_id: string;
          user_id: string;
          created_at?: string;
          role: 'TL' | 'L1' | 'L2';
        };
        Update: {
          id?: string;
          shift_id?: string;
          user_id?: string;
          created_at?: string;
          role?: 'TL' | 'L1' | 'L2';
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          role: 'TL' | 'L1' | 'L2';
          avatar_url: string | null;
          first_name: string;
          last_name: string;
          phone_number: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          role?: 'TL' | 'L1' | 'L2';
          avatar_url?: string | null;
          first_name: string;
          last_name: string;
          phone_number?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          role?: 'TL' | 'L1' | 'L2';
          avatar_url?: string | null;
          first_name?: string;
          last_name?: string;
          phone_number?: string | null;
        };
      };
    };
  };
}
