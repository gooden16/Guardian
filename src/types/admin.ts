export interface RoleChangeRequest {
  id: string;
  user_id: string;
  previous_role: string;
  requested_role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}