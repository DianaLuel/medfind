import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Clock3, MapPin, Phone } from "lucide-react";
import { AvailabilityStatus } from "@/components/availability-status";
import { ReportIssueForm } from "@/components/report-issue-form";
import { formatAddisTimestamp, sanitizePhone } from "@/lib/availability";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pharmacy details" };

type Props = { params: Promise<{ slug: string }> };

export default async function PharmacyDetailsPage({ params }: Props) {
  const { slug } = await params;
  if (!hasSupabaseConfig()) {
    return <main className="shell narrow-shell"><section className="page-heading"><p className="section-kicker">Pharmacy profile</p><h1>Profiles are not connected yet.</h1><p>There are no real pharmacy listings in this build. A profile will appear only after a genuine pharmacy is reviewed and added.</p><Link className="button button-secondary" style={{ marginTop: 22 }} href="/setup">Supabase setup</Link></section></main>;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();
  const { data: pharmacy } = await supabase.from("pharmacies").select("id,name,slug,address,neighborhood,phone,contact_email,latitude,longitude,opening_hours,is_verified")
    .eq("slug", slug).eq("is_approved", true).is("suspended_at", null).maybeSingle();
  if (!pharmacy) notFound();
  const { data: inventory } = await supabase.from("inventory_confirmations")
    .select("id,status,source,last_confirmed_at,expires_at,medicine:medicine_catalog(name,active_ingredient,strength,form)")
    .eq("pharmacy_id", pharmacy.id).order("last_confirmed_at", { ascending: false, nullsFirst: false }).limit(60);
  const phone = sanitizePhone(pharmacy.phone);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([pharmacy.name, pharmacy.address, pharmacy.neighborhood, "Addis Ababa"].filter(Boolean).join(", "))}`;
  const hours = Object.entries((pharmacy.opening_hours ?? {}) as Record<string, string>);

  return (
    <main className="shell">
      <section className="page-heading">
        <p className="section-kicker">Pharmacy profile · Addis Ababa</p>
        <h1>{pharmacy.name}</h1>
        <p>{pharmacy.is_verified ? <><BadgeCheck size={15} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 5 }} aria-hidden="true" />Business verified · </> : "Business not verified · "}{pharmacy.neighborhood ? `${pharmacy.neighborhood}, ` : ""}{pharmacy.address}</p>
        <div className="card-actions" style={{ marginTop: 20 }}>
          {phone ? <a className="button button-primary" href={`tel:${phone}`}><Phone size={15} aria-hidden="true" />Call pharmacy</a> : <span className="button button-secondary" aria-disabled="true">Phone not listed</span>}
          <a className="button button-secondary" href={directionsUrl} target="_blank" rel="noreferrer"><MapPin size={15} aria-hidden="true" />Directions <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </section>
      <section className="content-section">
        <div className="result-layout">
          <div className="result-list">
            <div className="panel"><h2>Contact and opening hours</h2><p style={{ color: "#728077", fontSize: 14 }}><MapPin size={14} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 5 }} aria-hidden="true" />{pharmacy.address}{pharmacy.neighborhood ? `, ${pharmacy.neighborhood}` : ""}</p>
              {pharmacy.contact_email && <p><a className="text-link" href={`mailto:${pharmacy.contact_email}`}>{pharmacy.contact_email}</a></p>}
              {hours.length ? <div className="table-wrap"><table><tbody>{hours.map(([day, time]) => <tr key={day}><th scope="row">{day}</th><td>{time}</td></tr>)}</tbody></table></div> : <p className="results-count">Opening hours have not been provided.</p>}
            </div>
            <div className="panel"><div className="panel-heading"><h2>Medicine availability</h2><span className="results-count">{inventory?.length ?? 0} record{inventory?.length === 1 ? "" : "s"}</span></div>
              {inventory?.length ? <div className="result-list">{inventory.map((record) => {
                const medicine = record.medicine as unknown as { name: string; active_ingredient: string | null; strength: string | null; form: string | null };
                return <article className="pharmacy-card" key={record.id}>
                  <div className="pharmacy-card-top"><div><h2>{[medicine.name, medicine.strength, medicine.form].filter(Boolean).join(" · ")}</h2>{medicine.active_ingredient && <p className="results-count">Active ingredient: {medicine.active_ingredient}</p>}</div><AvailabilityStatus status={record.status} expiresAt={record.expires_at} /></div>
                  <div className="availability-time" style={{ marginTop: 12 }}><Clock3 size={12} style={{ display: "inline", marginRight: 5 }} aria-hidden="true" />{formatAddisTimestamp(record.last_confirmed_at)} · {record.source === "pharmacy_staff" ? "Confirmed by pharmacy staff" : "Unverified source"}</div>
                  <div className="card-actions"><ReportIssueForm pharmacyId={pharmacy.id} confirmationId={record.id} /></div>
                </article>;
              })}</div> : <div className="empty-state" style={{ minHeight: 180 }}><h2>No availability records</h2><p>This pharmacy has not shared any medicine confirmation in the directory.</p></div>}
            </div>
          </div>
          <aside className="results-aside"><h3><Clock3 size={15} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 5 }} aria-hidden="true" />Please call first</h3><p>Stock may change after a confirmation. Contact the pharmacy to reconfirm availability and opening hours before travelling.</p><div style={{ marginTop: 18 }}><ReportIssueForm pharmacyId={pharmacy.id} /></div></aside>
        </div>
        <p className="search-note" style={{ marginTop: 17 }}>Directory information is not medical advice. No medicine or dose recommendations are provided.</p>
      </section>
    </main>
  );
}
