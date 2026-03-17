export interface Announcement {
  id: string;
  author_id: string;
  shift_id?: string | null;
  body: string;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
    role: string;
  };
}
