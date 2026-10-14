import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock3, PackageCheck, Store } from "lucide-react";
import { getSignedInContext } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { SignOutButton } from "@/components/sign-out-button";
import { StaffProfileForm } from "@/components/staff-profile-form";
import { StaffInventoryTable } from "@/components/staff-inventory-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pharmacy dashboard" };

export default async function StaffDashboardPage() {
  const { supabase, user, memberships } = await getSignedInContext();
  if (hasSupabaseConfig() && !user) redirect("/staff/sign-in");
  const membership = memberships[0];
  let inventory: { id: string; status: string; last_confirmed_at: string | null; expires_at: string | null; medicine: { name: string; strength: string | null; form: string | null } | null }[] = [];
  if (supabase && membership?.pharmacy?.is_approved && !membership.pharmacy.suspended_at) {
    const { data } = await supabase.from("inventory_confirmations").select("id,status,last_confirmed_at,expires_at,medicine:medicine_catalog(name,strength,form)")
      .eq("pharmacy_id", membership.pharmacy_id).order("last_confirmed_at", { ascending: false, nullsFirst: false }).limit(8);
    inventory = (data ?? []) as unknown as typeof inventory;
  }

  return (
    <main className="shell dashboard-shell">
      <div className="dashboard-head"><div><p className="section-kicker">Pharmacy workspace</p><h1>{membership?.pharmacy?.name ?? "Your pharmacy"}</h1><p>{user ? `Signed in as ${user.email ?? "authorized staff"}.` : "Manage your pharmacy’s directory profile and availability."}</p></div>{user && <SignOutButton />}</div>
      <nav className="dashboard-nav" aria-label="Pharmacy workspace navigation"><Link href="/staff">Overview</Link><Link href="/staff/inventory">Inventory</Link><a href="#profile">Pharmacy profile</a></nav>
      {!hasSupabaseConfig() && <div className="notice"><strong>Setup needed.</strong> Supabase credentials are not connected. This workspace does not have a test account or fake inventory. See <Link className="text-link" href="/setup">the setup guide</Link> to enable authentication and data storage.</div>}
      {hasSupabaseConfig() && user && !membership && <div className="notice"><strong>No pharmacy is linked to this account.</strong> Ask an administrator to link your staff account to the correct pharmacy. Until then, there is no inventory access.</div>}
      {membership && membership.pharmacy && <>
        <div className="dashboard-grid"><div className="metric-card"><span className="metric-label">Inventory entries shown</span><strong className="metric-value">{inventory.length}</strong></div><div className="metric-card"><span className="metric-label">Partner approval</span><strong className="metric-value" style={{ fontSize: 18 }}>{membership.pharmacy.is_approved ? "Approved" : "Pending"}</strong></div><div className="metric-card"><span className="metric-label">Availability updates</span><strong className="metric-value" style={{ fontSize: 18 }}>Timestamped</strong></div></div>
        <section className="panel"><div className="panel-heading"><h2><PackageCheck size={17} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 7 }} aria-hidden="true" />Recently updated inventory</h2><Link className="text-link" href="/staff/inventory">Manage inventory <ArrowRight size={13} style={{ display: "inline", verticalAlign: "middle" }} aria-hidden="true" /></Link></div>
          {membership.pharmacy.suspended_at ? <div className="notice">This pharmacy is suspended. Its inventory is hidden from the directory, and staff cannot view or change its inventory until an administrator reinstates it.</div> : inventory.length ? <StaffInventoryTable inventory={inventory} /> : <div className="empty-state" style={{ minHeight: 190 }}><span className="empty-icon"><Clock3 size={21} aria-hidden="true" /></span><h2>No inventory updates yet</h2><p>When this pharmacy is approved, use inventory management to enter genuine confirmations.</p></div>}
        </section>
        <section className="panel" id="profile"><div className="panel-heading"><h2><Store size={17} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 7 }} aria-hidden="true" />Pharmacy profile</h2></div>{membership.pharmacy.suspended_at ? <div className="notice">Profile changes are disabled while this pharmacy is suspended. Contact the directory administrator for assistance.</div> : <StaffProfileForm pharmacyId={membership.pharmacy_id} pharmacy={membership.pharmacy} />}</section>
      </>}
    </main>
  );
}
