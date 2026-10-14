import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ClipboardList, ShieldCheck } from "lucide-react";
import { AdminControlPanel } from "@/components/admin-control-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { getSignedInContext, userIsAdmin } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrator dashboard" };

type StaleInventory = { id: string; status: string; expires_at: string | null; last_confirmed_at: string | null; pharmacy: { name: string; slug: string } | null; medicine: { name: string; strength: string | null; form: string | null } | null };

export default async function AdminDashboardPage() {
  const { supabase, user } = await getSignedInContext();
  let isAdmin = false;
  if (supabase && user) isAdmin = await userIsAdmin(supabase, user.id);
  if (!hasSupabaseConfig()) return <main className="shell dashboard-shell"><div className="dashboard-head"><div><p className="section-kicker">Operations</p><h1>Administrator dashboard</h1></div></div><div className="notice"><strong>Supabase is not connected.</strong> Admin authentication, registrations, reports, and operational metrics are unavailable. No fake dashboard counts are shown. See the <Link className="text-link" href="/setup">setup guide</Link>.</div></main>;
  if (!user) return <main className="shell dashboard-shell"><div className="dashboard-head"><div><p className="section-kicker">Operations</p><h1>Administrator dashboard</h1><p>Sign in with an authorized administrator account to continue.</p></div></div><div className="panel"><ShieldCheck size={22} color="var(--forest)" /><p style={{ marginTop: 10 }}>Administrator access is limited to assigned admin accounts.</p><Link className="button button-primary button-small" href="/staff/sign-in">Sign in</Link></div></main>;
  if (!isAdmin || !supabase) return <main className="shell dashboard-shell"><div className="dashboard-head"><div><p className="section-kicker">Operations</p><h1>Administrator dashboard</h1><p>Your account is signed in, but it is not assigned the administrator role.</p></div><SignOutButton /></div><div className="notice">For account safety, this account cannot view registrations, reports, or other pharmacies. Ask the project administrator to review access.</div></main>;

  const now = new Date().toISOString();
  const [registrations, reports, pharmacies, members, inventory, expirySetting] = await Promise.all([
    supabase.from("pharmacy_registrations").select("id,pharmacy_name,contact_name,contact_email,phone,address,neighborhood,message,submitted_at,status,linked_pharmacy_id").eq("status", "pending").order("submitted_at", { ascending: true }).limit(50),
    supabase.from("availability_reports").select("id,pharmacy_id,confirmation_id,category,details,status,submitted_at,pharmacy:pharmacies(name)").in("status", ["pending","reviewed"]).order("submitted_at", { ascending: true }).limit(100),
    supabase.from("pharmacies").select("id,name,slug,is_verified,suspended_at,is_approved,neighborhood,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("pharmacy_members").select("id,user_id,pharmacy_id,role,is_active,pharmacy:pharmacies(name)").order("created_at", { ascending: false }).limit(200),
    supabase.from("inventory_confirmations").select("id,status,last_confirmed_at,expires_at,pharmacy:pharmacies(name,slug),medicine:medicine_catalog(name,strength,form)", { count: "exact" }).or(`expires_at.lte.${now},expires_at.is.null`).order("expires_at", { ascending: true }).limit(100),
    supabase.from("app_settings").select("value").eq("key", "availability_expiry_hours").maybeSingle(),
  ]);
  const stale = (inventory.data ?? []) as unknown as StaleInventory[];
  const expiredCount = inventory.count ?? stale.length;
  const expiryHours = Number((expirySetting.data?.value as { hours?: number } | null)?.hours ?? 24);

  return (
    <main className="shell dashboard-shell">
      <div className="dashboard-head"><div><p className="section-kicker">Operations</p><h1>Administrator dashboard</h1><p>Review partner applications, maintain safe access, and monitor record freshness.</p></div><SignOutButton /></div>
      <div className="dashboard-grid"><div className="metric-card"><span className="metric-label">Pending applications</span><strong className="metric-value">{registrations.data?.length ?? 0}</strong></div><div className="metric-card"><span className="metric-label">Pharmacy profiles</span><strong className="metric-value">{pharmacies.data?.length ?? 0}</strong></div><div className="metric-card"><span className="metric-label">Expired records</span><strong className="metric-value">{expiredCount}</strong></div></div>
      <section id="freshness" className="panel">
        <div className="panel-heading"><h2>Stale inventory records</h2><span className="results-count">{expiredCount} expired</span></div>
        {stale.length ? <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Pharmacy</th><th>Last confirmed</th><th>Expired</th><th>Status</th></tr></thead><tbody>{stale.map((record) => <tr key={record.id}><td>{[record.medicine?.name, record.medicine?.strength, record.medicine?.form].filter(Boolean).join(" · ") || "Catalog entry"}</td><td>{record.pharmacy?.slug ? <Link className="text-link" href={`/pharmacies/${encodeURIComponent(record.pharmacy.slug)}`}>{record.pharmacy.name}</Link> : record.pharmacy?.name ?? "Pharmacy"}</td><td>{record.last_confirmed_at ? new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(new Date(record.last_confirmed_at)) : "Not recorded"}</td><td>{record.expires_at ? new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(new Date(record.expires_at)) : "No expiry"}</td><td>Needs reconfirmation</td></tr>)}</tbody></table></div> : <p className="results-count">No expired inventory records.</p>}
        <p className="auth-footnote">Expired records are not presented to visitors as current stock. The expiry setting below controls new confirmations only.</p>
      </section>
      <AdminControlPanel registrations={(registrations.data ?? []) as never[]} reports={(reports.data ?? []) as never[]} pharmacies={(pharmacies.data ?? []) as never[]} members={(members.data ?? []) as never[]} expiryHours={expiryHours} adminUserId={user.id} />
      <p className="search-note"><ClipboardList size={13} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 5 }} aria-hidden="true" />Metrics reflect database records only. A business verification badge should be applied only after an actual identity review. <BadgeCheck size={13} style={{ display: "inline", verticalAlign: "text-bottom", margin: "0 4px" }} aria-hidden="true" /></p>
    </main>
  );
}
