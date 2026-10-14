import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PharmacyMembership } from "@/lib/types";

export async function getSignedInContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, memberships: [] as PharmacyMembership[] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, memberships: [] as PharmacyMembership[] };
  const { data } = await supabase
    .from("pharmacy_members")
    .select("pharmacy_id,role,pharmacy:pharmacies(id,name,slug,address,neighborhood,phone,contact_email,opening_hours,is_approved,is_verified,suspended_at)")
    .eq("user_id", user.id)
    .eq("is_active", true);
  return { supabase, user, memberships: (data ?? []) as unknown as PharmacyMembership[] };
}

export async function userIsAdmin(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !error && data?.role === "admin";
}
