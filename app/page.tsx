import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Clock3, MapPin, PhoneCall, Sprout, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SearchForm } from "@/components/search-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

type Partner = { id: string; name: string; slug: string; address: string; neighborhood: string | null; phone: string | null; is_verified: boolean };

export default async function HomePage() {
  const configured = hasSupabaseConfig();
  let partners: Partner[] = [];
  let partnerError = false;
  if (configured) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from("pharmacies").select("id,name,slug,address,neighborhood,phone,is_verified").eq("is_approved", true).is("suspended_at", null).order("name").limit(4);
      partners = (data ?? []) as Partner[];
      partnerError = Boolean(error);
    }
  }

  return (
    <main>
      <section className="shell hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Starting with Addis Ababa</div><h1>Find your medicine <span className="display-serif">before you travel.</span></h1><p className="hero-description">Check when a pharmacy last confirmed a medicine, then call ahead to make sure it is still available. Less guesswork before you make the trip.</p><SearchForm /><p className="search-note">Availability changes. Always call the pharmacy to reconfirm before travelling.{!configured && <> <Link className="text-link" href="/setup">No live pharmacy network is connected yet.</Link></>}</p></div>
        <div className="hero-aside" aria-label="How MedFind works"><div className="hero-ornament" aria-hidden="true" /><div className="approach-card"><div className="approach-head"><span>A CLEARER WAY TO SEARCH</span><strong>01 — 03</strong></div><div className="approach-step"><span className="step-number">01</span><div><h3>Search by medicine</h3><p>Use a medicine name or active ingredient.</p></div></div><div className="approach-step"><span className="step-number">02</span><div><h3>Check the confirmation</h3><p>See whether a pharmacy confirmed it, and when.</p></div></div><div className="approach-step"><span className="step-number">03</span><div><h3>Call before you go</h3><p>Ask the pharmacy to reconfirm current stock.</p></div></div><div className="approach-foot">No availability is shown as live until it has been genuinely confirmed by a participating pharmacy.</div></div></div>
      </section>
      <section className="section section-soft"><div className="shell"><Reveal className="section-heading"><p className="section-kicker">How it works</p><h2 className="section-title">A little more certainty before you set out.</h2><p className="section-description">MedFind makes recent pharmacy confirmations easier to find. It does not replace a quick call to the pharmacy.</p></Reveal><div className="steps-grid"><Reveal className="step-card" delay={0.02}><p className="step-label">STEP 01</p><h3>Look up a medicine</h3><p>Search by the name on the package or by its active ingredient, then narrow by neighborhood, strength, or form.</p></Reveal><Reveal className="step-card" delay={0.08}><p className="step-label">STEP 02</p><h3>Read the time, not just the status</h3><p>Each pharmacy record shows its last-confirmed time. Older confirmations are marked for reconfirmation.</p></Reveal><Reveal className="step-card" delay={0.14}><p className="step-label">STEP 03</p><h3>Call before you go</h3><p>Contact the pharmacy to confirm availability and opening hours before travelling.</p></Reveal></div></div></section>
      <section className="section"><div className="shell trust-layout"><Reveal className="trust-seal"><div className="trust-seal-inner"><ShieldCheck size={37} strokeWidth={1.5} /><span>Clear about what is known—and what is not</span></div></Reveal><Reveal><p className="section-kicker">Trust is part of the search</p><h2 className="section-title">Availability should come with a timestamp.</h2><p className="section-description">A status without context can mislead. MedFind is built to make the source and freshness of each record visible, and to be honest when information is missing.</p><ul className="trust-points"><li><Clock3 size={18} aria-hidden="true" /><span>Confirmation time is shown alongside the availability status.</span></li><li><BadgeCheck size={18} aria-hidden="true" /><span>Pharmacy-confirmed records are distinguished from unverified information.</span></li><li><PhoneCall size={18} aria-hidden="true" /><span>Users are reminded to call before making a trip.</span></li></ul><div style={{ marginTop: 24 }}><Link className="button button-secondary" href="/safety">How availability works <ArrowRight size={15} aria-hidden="true" /></Link></div></Reveal></div></section>
      <section className="section section-soft"><div className="shell"><div className="partners-band"><div><p className="section-kicker">Working with pharmacies</p><h2 className="section-title" style={{ maxWidth: 480, marginBottom: 12 }}>A useful directory starts with real confirmations.</h2><p className="section-description" style={{ maxWidth: 570 }}>Pharmacy partners keep their own profiles and availability up to date. Listings appear after a pharmacy is reviewed—no made-up locations or stock.</p><div style={{ marginTop: 22 }}><Link className="button button-primary" href="/partners/apply">Apply to participate <ArrowRight size={15} aria-hidden="true" /></Link></div></div><div className="partner-empty"><span className="empty-tag"><Sprout size={14} aria-hidden="true" /> Partner directory</span>{partnerError ? <p>Partner listings could not be loaded just now. Please try again shortly.</p> : partners.length ? <div className="partner-list">{partners.map((partner) => <Link key={partner.id} className="partner-list-item" href={`/pharmacies/${encodeURIComponent(partner.slug)}`}><span><strong>{partner.name}</strong><small>{partner.neighborhood ? `${partner.neighborhood} · ` : ""}{partner.address}</small></span><span className="partner-status">{partner.is_verified && <><BadgeCheck size={13} aria-hidden="true" /> Verified</>}<ArrowUpRight size={14} aria-hidden="true" /></span></Link>)}</div> : <p>{configured ? "No approved pharmacy partners are listed yet. Real profiles will appear after an administrator reviews them." : "No live pharmacy network is connected yet. Once real partners are reviewed and connected, their profiles and genuine confirmations will appear here."}</p>}</div></div></div></section>
      <section className="section" style={{ paddingTop: 0 }}><div className="shell"><div className="safety-note"><MapPin size={18} aria-hidden="true" /><p><strong>Before travelling:</strong> Contact the pharmacy to reconfirm the medicine is still available. MedFind is a directory, not a medical advice service.</p></div></div></section>
    </main>
  );
}
