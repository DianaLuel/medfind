export type AvailabilityState = "in_stock" | "unavailable" | "unknown";

export type MedicineRecord = {
  id: string;
  name: string;
  active_ingredient: string | null;
  strength: string | null;
  form: string | null;
};

export type PharmacyRecord = {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: Record<string, string> | null;
  is_verified: boolean;
};

export type AvailabilityRecord = {
  id: string;
  status: AvailabilityState;
  source: string;
  last_confirmed_at: string | null;
  expires_at: string | null;
  medicine: MedicineRecord;
  pharmacy: PharmacyRecord;
};

export type PublicSearchResponse = {
  configured: boolean;
  results: AvailabilityRecord[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

export type PharmacyMembership = {
  pharmacy_id: string;
  role: "owner" | "manager" | "staff";
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    address: string;
    neighborhood: string | null;
    phone: string | null;
    contact_email: string | null;
    opening_hours: Record<string, string> | null;
    is_approved: boolean;
    is_verified: boolean;
    suspended_at: string | null;
  } | null;
};
