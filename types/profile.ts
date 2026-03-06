export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country_code: string | null;
  role: "admin" | "user";
  created_at: string;
};

export type ProfileUpdateData = {
  first_name: string;
  last_name: string;
  phone?: string;
  country_code?: string;
};
