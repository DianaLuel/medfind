import type { Metadata } from "next";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  const connected = hasSupabaseConfig();
  return (
    <main className="shell narrow-shell">
      <section className="page-heading"><p className="section-kicker">Privacy and data care</p><h1>Your search is yours.</h1><p>MedFind is designed to help with a practical availability question without creating a medical profile.</p></section>
      <article className="prose content-section">
        <div className="notice"><strong>Service status:</strong> {connected ? "Supabase environment values are present. Search terms are used transiently to query the directory and are not saved as visitor search history by this app." : "No Supabase project is connected in this preview, and no real inventory is presented."}</div>
        <h2>Medicine searches</h2>
        <p>Medicine search terms are used to query the directory and are not saved as a visitor search history by this application or associated with an account. A search term appears in the search-page URL and may remain in your browser history. Location is optional; it is used on your device to sort the loaded results and is not sent to the directory or stored by MedFind.</p>
        <h2>Pharmacy information</h2>
        <p>Pharmacy profiles, staff accounts, inventory confirmations, partner applications, and issue reports are operational records used to run and review the directory. Staff access is limited by pharmacy membership and database policies. A pharmacy user must not see individual customer medicine searches.</p>
        <h2>Retention</h2>
        <p>Only information needed to review a partner, display a current profile, manage an account, or investigate a report should be retained. Pending applications and issue reports should be reviewed and removed when no longer needed. Availability records have an expiry time and should be retained only as operationally necessary for freshness and auditability. The operating team must set and follow a retention schedule before onboarding live partners.</p>
        <h2>Contact</h2>
        <p>For pharmacy participation, use the <a className="text-link" href="/partners/apply">partner application form</a>. A general support contact will be published once the directory operator designates one.</p>
      </article>
    </main>
  );
}
