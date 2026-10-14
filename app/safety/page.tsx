import type { Metadata } from "next";
import { AlertTriangle, BadgeCheck, Clock3 } from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Availability and safety" };

export default function SafetyPage() {
  const connected = hasSupabaseConfig();
  return (
    <main className="shell narrow-shell">
      <section className="page-heading"><p className="section-kicker">How availability works</p><h1>Freshness matters.</h1><p>MedFind is a medicine availability directory—not a medical advice service.</p></section>
      <article className="prose content-section">
        <div className="safety-note"><AlertTriangle size={18} aria-hidden="true" /><p><strong>Please call before travelling.</strong> Pharmacy stock can change after any confirmation; a listing cannot guarantee that an item remains available.</p></div>
        <h2>What each status means</h2>
        <ul><li><strong>Pharmacy confirmed in stock:</strong> pharmacy staff recorded a recent positive confirmation. It is not a reservation or guarantee.</li><li><strong>Pharmacy confirmed unavailable:</strong> pharmacy staff recorded that the medicine was unavailable at that time.</li><li><strong>Availability unknown:</strong> no usable current status is available.</li><li><strong>Availability needs reconfirmation:</strong> the record reached its expiry time or its confirmation time is missing.</li></ul>
        <h2>Who confirmed it and when</h2>
        <p>Availability records show their confirmation source and exact timestamp in Addis Ababa time. Unverified information must not look like a pharmacy confirmation. Confirmations expire after a configurable period; an expired record is not represented as current stock.</p>
        <h2>What MedFind does not do</h2>
        <p>MedFind does not recommend prescription medicines, advise on dosage, or automatically substitute one medicine for another. For clinical questions, please contact a qualified healthcare professional.</p>
        <div className="notice"><Clock3 size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 7 }} aria-hidden="true" />{connected ? "The app can query Supabase, but only approved records entered by genuine pharmacy partners should be displayed." : "The current preview has no live pharmacy inventory connected. Availability appears only after real partner data and credentials are configured."}</div>
        <h2>For pharmacies</h2>
        <p>Authorized pharmacy staff can update only their own pharmacy&apos;s records. Each update sets its source, staff actor, confirmation timestamp, and expiry automatically. Administrators review partner registrations, issue reports, and stale information.</p>
        <p><BadgeCheck size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 6, color: "var(--forest)" }} aria-hidden="true" /> A verified business badge refers to a reviewed pharmacy business identity; it is not a clinical endorsement.</p>
      </article>
    </main>
  );
}
