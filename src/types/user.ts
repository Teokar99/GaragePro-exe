export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'mechanic';
  created_at: string;
  updated_at: string;
}
