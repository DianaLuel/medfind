import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StaffInventoryPanel } from "@/components/staff-inventory-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { getSignedInContext } from "@/lib/supabase/auth";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Inventory management" };

export default async function StaffInventoryPage() {
  const { user, memberships } = await getSignedInContext();
  if (hasSupabaseConfig() && !user) redirect("/staff/sign-in");
  const membership = memberships[0];
  return (
    <main className="shell dashboard-shell">
      <div className="dashboard-head"><div><p className="section-kicker">Pharmacy workspace</p><h1>Inventory management</h1><p>Search or add medicine entries and record genuine availability confirmations.</p></div>{user && <SignOutButton />}</div>
      <nav className="dashboard-nav" aria-label="Pharmacy workspace navigation"><Link href="/staff">Overview</Link><Link href="/staff/inventory">Inventory</Link><Link href="/staff#profile">Pharmacy profile</Link></nav>
      {!hasSupabaseConfig() && <div className="notice"><strong>Setup needed.</strong> Supabase is not connected, so this page cannot read or update inventory. See the <Link className="text-link" href="/setup">setup guide</Link>.</div>}
      {hasSupabaseConfig() && user && !membership && <div className="notice">No pharmacy is linked to this account. Inventory access remains unavailable until an administrator assigns a pharmacy membership.</div>}
      {membership?.pharmacy && <section className="panel"><h2>{membership.pharmacy.name}</h2>{membership.pharmacy.is_approved && !membership.pharmacy.suspended_at ? <StaffInventoryPanel pharmacyId={membership.pharmacy_id} pharmacyName={membership.pharmacy.name} /> : <div className="notice">{membership.pharmacy.suspended_at ? "This pharmacy is suspended. Inventory updates are disabled until an administrator reinstates it." : "This pharmacy is awaiting administrator approval. Inventory cannot be published until approval."}</div>}</section>}
    </main>
  );
}
