import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvailabilityRecord, MedicineRecord, PharmacyRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  q: z.string().trim().max(100).default(""),
  neighborhood: z.string().trim().max(80).default(""),
  strength: z.string().trim().max(60).default(""),
  form: z.string().trim().max(40).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Search filters are not valid." }, { status: 400 });
  const { q, neighborhood, strength, form, page } = parsed.data;
  if (!q) return NextResponse.json({ configured: true, results: [], total: 0, page, pageSize: PAGE_SIZE });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ configured: false, results: [], total: 0, page, pageSize: PAGE_SIZE });

  try {
    const safeTerm = q.replace(/[,%()*]/g, " ").replace(/\s+/g, " ").trim();
    if (!safeTerm) return NextResponse.json({ configured: true, results: [], total: 0, page, pageSize: PAGE_SIZE });
    let medicineQuery = supabase.from("medicine_catalog").select("id,name,active_ingredient,strength,form").eq("is_active", true);
    medicineQuery = medicineQuery.or(`name.ilike.%${safeTerm}%,active_ingredient.ilike.%${safeTerm}%`);
    if (strength) medicineQuery = medicineQuery.ilike("strength", `%${strength.replace(/[,%()*]/g, " ")}%`);
    if (form) medicineQuery = medicineQuery.ilike("form", `%${form.replace(/[,%()*]/g, " ")}%`);
    const { data: medicines, error: medicineError } = await medicineQuery.limit(100);
    if (medicineError) throw medicineError;
    if (!medicines?.length) return NextResponse.json({ configured: true, results: [], total: 0, page, pageSize: PAGE_SIZE });

    let pharmaciesQuery = supabase.from("pharmacies").select("id").eq("is_approved", true).is("suspended_at", null);
    if (neighborhood) pharmaciesQuery = pharmaciesQuery.eq("neighborhood", neighborhood);
    const { data: pharmacies, error: pharmacyError } = await pharmaciesQuery.limit(500);
    if (pharmacyError) throw pharmacyError;
    if (!pharmacies?.length) return NextResponse.json({ configured: true, results: [], total: 0, page, pageSize: PAGE_SIZE });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await supabase
      .from("inventory_confirmations")
      .select(
        "id,status,source,last_confirmed_at,expires_at,medicine:medicine_catalog!inner(id,name,active_ingredient,strength,form),pharmacy:pharmacies!inner(id,name,slug,address,neighborhood,phone,latitude,longitude,opening_hours,is_verified)",
        { count: "exact" },
      )
      .in("medicine_id", medicines.map((medicine) => medicine.id))
      .in("pharmacy_id", pharmacies.map((pharmacy) => pharmacy.id))
      .order("last_confirmed_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) throw error;

    const results: AvailabilityRecord[] = (data ?? []).map((record) => {
      const medicine = record.medicine as unknown as MedicineRecord;
      const pharmacy = record.pharmacy as unknown as PharmacyRecord;
      return {
        id: record.id,
        status: record.status as AvailabilityRecord["status"],
        source: record.source,
        last_confirmed_at: record.last_confirmed_at,
        expires_at: record.expires_at,
        medicine,
        pharmacy: {
          ...pharmacy,
          latitude: pharmacy.latitude === null ? null : Number(pharmacy.latitude),
          longitude: pharmacy.longitude === null ? null : Number(pharmacy.longitude),
        },
      };
    });

    return NextResponse.json({ configured: true, results, total: count ?? results.length, page, pageSize: PAGE_SIZE });
  } catch {
    console.error("Public medicine search failed");
    return NextResponse.json({ configured: true, results: [], total: 0, page, pageSize: PAGE_SIZE, error: "Search is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
