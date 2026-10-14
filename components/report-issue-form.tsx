"use client";

import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ReportIssueForm({ pharmacyId, confirmationId }: { pharmacyId: string; confirmationId?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) { setSuccess(false); setMessage("Reports are unavailable until the directory is connected."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    const details = String(data.get("details") ?? "").trim();
    if (details.length > 1000) { setSuccess(false); setMessage("Keep the note under 1,000 characters."); return; }
    setBusy(true); setMessage("");
    const { error } = await client.from("availability_reports").insert({
      pharmacy_id: pharmacyId,
      confirmation_id: confirmationId || null,
      category: String(data.get("category")),
      details: details || null,
    });
    setBusy(false);
    if (error) { setSuccess(false); setMessage("Your report could not be sent. Please try again later."); return; }
    setSuccess(true); setMessage("Report received for administrator review. No account or medicine-search history was attached."); form.reset();
  }

  return (
    <div>
      <button className="button button-quiet button-small" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Close report form" : "Report an issue"}</button>
      {open && <form className="panel" style={{ marginTop: 12 }} onSubmit={submit}>
        <h2>What should an administrator review?</h2>
        <div className="field"><label htmlFor="report-category">Issue type</label><select id="report-category" name="category" defaultValue="stock_inaccurate"><option value="stock_inaccurate">Availability may be inaccurate</option><option value="business_details">Pharmacy details need correction</option><option value="other">Other</option></select></div>
        <div className="field" style={{ marginTop: 10 }}><label htmlFor="report-details">Details <span style={{ fontWeight: 400 }}>(optional)</span></label><textarea id="report-details" name="details" maxLength={1000} /></div>
        <p className="auth-footnote">Do not include patient names, personal details, or other sensitive health information. Describe only the availability or business issue.</p>
        <button className="button button-secondary button-small" style={{ marginTop: 12 }} type="submit" disabled={busy}>{busy ? "Sending…" : "Send report"}</button>
        {message && <p className={success ? "form-success" : "form-error"} role="status">{message}</p>}
      </form>}
    </div>
  );
}
