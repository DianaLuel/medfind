import type { Metadata } from "next";
import Link from "next/link";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Supabase setup" };

export default function SetupPage() {
  const configured = hasSupabaseConfig();
  return (
    <main className="shell narrow-shell">
      <section className="page-heading">
        <p className="section-kicker">Operator setup</p>
        <h1>Connect a real pharmacy network.</h1>
        <p>Database and staff authentication require a Supabase project. This page shows the current environment status and setup steps.</p>
      </section>
      <section className="content-section prose">
        <div className={configured ? "form-success" : "notice"} role="status"><strong>{configured ? "Supabase variables are present." : "Supabase is not configured."}</strong> {configured ? "Apply the migration and verify RLS before adding any partner data." : "Live search, staff sign-in, and pharmacy applications remain safely disabled. No real pharmacy or stock data is displayed."}</div>
        <h2>Quick setup</h2>
        <ol>
          <li>Create a Supabase project and set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in the application environment. For production, add these browser-public values before building the app; rebuild and redeploy after changing them.</li>
          <li>Run <code>supabase/migrations/202610130001_medfind.sql</code> in Supabase SQL Editor.</li>
          <li>Enable Supabase Email Auth, create an administrator and bootstrap its role as described in the SQL file.</li>
          <li>Review and approve pharmacy applications; link each invited staff Auth account to its pharmacy.</li>
        </ol>
        <p><strong>Never expose a Supabase service-role key in browser code or a <code>NEXT_PUBLIC_*</code> variable.</strong> Normal application access uses the public anon key with RLS.</p>
        <p><Link className="text-link" href="/safety">Read the availability safety policy</Link> · <Link className="text-link" href="/partners/apply">Pharmacy application</Link></p>
        <div className="notice">The complete migration, setup instructions, retention considerations, and go-live checklist are in <code>SUPABASE_SETUP.md</code> in the project source.</div>
      </section>
    </main>
  );
}
