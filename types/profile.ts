export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country_code: string | null;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  // Enriched from auth.users
  email?: string | null;
};

export type ProfileUpdateData = {
  first_name: string;
  last_name: string;
  phone?: string;
  country_code?: string;
};
