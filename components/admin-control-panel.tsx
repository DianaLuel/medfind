"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Registration = {
  id: string; pharmacy_name: string; contact_name: string; contact_email: string; phone: string;
  address: string; neighborhood: string; message: string | null; submitted_at: string; status: string;
  linked_pharmacy_id: string | null;
};
type Pharmacy = { id: string; name: string; slug: string; is_verified: boolean; suspended_at: string | null; is_approved: boolean; neighborhood: string; created_at: string };
type Member = { id: string; user_id: string; pharmacy_id: string; role: "owner" | "manager" | "staff"; is_active: boolean; pharmacy: { name: string } | null };
type Report = { id: string; pharmacy_id: string; confirmation_id: string | null; category: string; details: string | null; status: string; submitted_at: string; pharmacy: { name: string } | null };

const membershipSchema = z.object({
  user_id: z.string().uuid("Enter the invited staff user's Supabase Auth UUID."),
  pharmacy_id: z.string().uuid("Select a pharmacy."),
  role: z.enum(["owner", "manager", "staff"]),
});

function slugify(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "pharmacy";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ET", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }).format(new Date(value));
}

export function AdminControlPanel({
  registrations, reports, pharmacies, members, expiryHours, adminUserId,
}: {
  registrations: Registration[]; reports: Report[]; pharmacies: Pharmacy[]; members: Member[]; expiryHours: number; adminUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function setResult(ok: boolean, text: string) { setSuccess(ok); setMessage(text); }

  async function reviewRegistration(registration: Registration, decision: "approve" | "reject") {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusyId(registration.id); setMessage("");
    if (decision === "reject") {
      const { error } = await client.from("pharmacy_registrations").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", registration.id).eq("status", "pending");
      setBusyId("");
      if (error) { setResult(false, "The application review could not be saved."); return; }
      setResult(true, "Application marked as rejected."); router.refresh(); return;
    }

    const slug = `${slugify(registration.pharmacy_name)}-${registration.id.slice(0, 6)}`;
    const { data: created, error: createError } = await client.from("pharmacies").insert({
      name: registration.pharmacy_name, slug, address: registration.address, neighborhood: registration.neighborhood,
      phone: registration.phone, contact_email: registration.contact_email, is_approved: true, is_verified: false,
    }).select("id").single();
    if (createError || !created) { setBusyId(""); setResult(false, "The pharmacy profile could not be created. Review the submitted details and try again."); return; }
    const { error: reviewError } = await client.from("pharmacy_registrations").update({
      status: "approved", linked_pharmacy_id: created.id, reviewed_at: new Date().toISOString(),
    }).eq("id", registration.id).eq("status", "pending");
    if (reviewError) {
      await client.from("pharmacies").delete().eq("id", created.id);
      setBusyId(""); setResult(false, "The application status could not be updated. The created profile was rolled back; please retry."); return;
    }
    setBusyId(""); setResult(true, "Application approved. The profile is listed but not marked business-verified; assign staff access separately after review."); router.refresh();
  }

  async function togglePharmacy(pharmacy: Pharmacy, field: "is_verified" | "suspended_at") {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusyId(pharmacy.id); setMessage("");
    const update = field === "is_verified" ? { is_verified: !pharmacy.is_verified } : { suspended_at: pharmacy.suspended_at ? null : new Date().toISOString() };
    const { error } = await client.from("pharmacies").update(update).eq("id", pharmacy.id);
    setBusyId("");
    if (error) { setResult(false, "The pharmacy account change could not be saved."); return; }
    setResult(true, field === "is_verified" ? (pharmacy.is_verified ? "Business verification removed." : "Business marked verified. Confirm that identity checks are complete first.") : (pharmacy.suspended_at ? "Pharmacy access reinstated." : "Pharmacy suspended."));
    router.refresh();
  }

  async function addMembership(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const form = event.currentTarget;
    const parsed = membershipSchema.safeParse(Object.fromEntries(new FormData(form).entries()));
    if (!parsed.success) { setResult(false, parsed.error.issues[0]?.message ?? "Check the account fields."); return; }
    setBusyId("membership"); setMessage("");
    const { error } = await client.from("pharmacy_members").upsert({ ...parsed.data, is_active: true }, { onConflict: "user_id,pharmacy_id" });
    setBusyId("");
    if (error) { setResult(false, "The staff membership could not be saved. Verify the Auth user ID and pharmacy."); return; }
    setResult(true, "Staff membership added or reactivated."); form.reset(); router.refresh();
  }

  async function toggleMembership(member: Member) {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusyId(member.id); setMessage("");
    const { error } = await client.from("pharmacy_members").update({ is_active: !member.is_active }).eq("id", member.id);
    setBusyId("");
    if (error) { setResult(false, "Membership access could not be updated."); return; }
    setResult(true, member.is_active ? "Pharmacy membership deactivated." : "Pharmacy membership reactivated."); router.refresh();
  }

  async function reviewReport(report: Report, status: "reviewed" | "resolved" | "dismissed") {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusyId(report.id); setMessage("");
    const { error } = await client.from("availability_reports").update({ status, reviewed_at: new Date().toISOString(), reviewer_id: adminUserId }).eq("id", report.id);
    setBusyId("");
    if (error) { setResult(false, "The report status could not be updated."); return; }
    setResult(true, `Report marked ${status}.`); router.refresh();
  }

  async function saveExpiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const form = event.currentTarget;
    const hours = Number(new FormData(form).get("hours"));
    if (!Number.isInteger(hours) || hours < 1 || hours > 720) { setResult(false, "Choose an expiry from 1 to 720 hours."); return; }
    setBusyId("expiry"); setMessage("");
    const { error } = await client.from("app_settings").update({ value: { hours } }).eq("key", "availability_expiry_hours");
    setBusyId("");
    if (error) { setResult(false, "Expiry setting could not be saved."); return; }
    setResult(true, `New confirmations will expire after ${hours} hour${hours === 1 ? "" : "s"}.`); router.refresh();
  }

  return (
    <div>
      {message && <p className={success ? "form-success" : "form-error"} role="status">{message}</p>}
      <section id="applications" className="panel">
        <div className="panel-heading"><h2>Pharmacy applications</h2><span className="results-count">{registrations.length} pending</span></div>
        {registrations.length ? <div className="result-list">{registrations.map((registration) => <article className="pharmacy-card" key={registration.id}>
          <div className="pharmacy-card-top"><div><h2>{registration.pharmacy_name}</h2><div className="pharmacy-meta"><span>{registration.neighborhood}, {registration.address}</span><span>Submitted {formatDate(registration.submitted_at)}</span></div></div><span className="status-pill status-unknown"><span className="status-dot" />Pending review</span></div>
          <p style={{ margin: "12px 0 0", color: "#758077", fontSize: 13 }}>{registration.contact_name} · <a className="text-link" href={`mailto:${registration.contact_email}`}>{registration.contact_email}</a> · <a className="text-link" href={`tel:${registration.phone}`}>{registration.phone}</a></p>
          {registration.message && <p style={{ margin: "8px 0 0", color: "#758077", fontSize: 13 }}>{registration.message}</p>}
          <div className="card-actions"><button className="button button-primary button-small" type="button" disabled={!!busyId} onClick={() => reviewRegistration(registration, "approve")}>{busyId === registration.id ? "Saving…" : "Approve listing"}</button><button className="button button-secondary button-small" type="button" disabled={!!busyId} onClick={() => reviewRegistration(registration, "reject")}>Reject</button></div>
        </article>)}</div> : <p className="results-count">No pending applications.</p>}
      </section>

      <section id="pharmacies" className="panel">
        <div className="panel-heading"><h2>Pharmacy accounts</h2><span className="results-count">{pharmacies.length} profile{pharmacies.length === 1 ? "" : "s"}</span></div>
        {pharmacies.length ? <div className="table-wrap"><table><thead><tr><th>Pharmacy</th><th>Neighborhood</th><th>Approval</th><th>Business check</th><th>Access</th><th>Actions</th></tr></thead><tbody>{pharmacies.map((pharmacy) => <tr key={pharmacy.id}>
          <td><a className="text-link" href={`/pharmacies/${encodeURIComponent(pharmacy.slug)}`} target="_blank" rel="noreferrer">{pharmacy.name}</a></td><td>{pharmacy.neighborhood}</td><td>{pharmacy.is_approved ? "Approved" : "Pending"}</td><td>{pharmacy.is_verified ? "Verified" : "Not verified"}</td><td>{pharmacy.suspended_at ? "Suspended" : "Active"}</td>
          <td><div className="card-actions" style={{ margin: 0 }}><button className="button button-secondary button-small" type="button" disabled={!!busyId} onClick={() => togglePharmacy(pharmacy, "is_verified")}>{pharmacy.is_verified ? "Unverify" : "Verify"}</button><button className="button button-secondary button-small" type="button" disabled={!!busyId} onClick={() => togglePharmacy(pharmacy, "suspended_at")}>{pharmacy.suspended_at ? "Reinstate" : "Suspend"}</button></div></td>
        </tr>)}</tbody></table></div> : <p className="results-count">No pharmacy accounts are recorded.</p>}
      </section>

      <section id="accounts" className="panel">
        <div className="panel-heading"><h2>Staff account access</h2><span className="results-count">{members.length} membership{members.length === 1 ? "" : "s"}</span></div>
        <form className="form-grid" onSubmit={addMembership}>
          <div className="field"><label htmlFor="member-user-id">Supabase Auth user UUID</label><input id="member-user-id" name="user_id" placeholder="UUID of an invited staff account" required /></div>
          <div className="field"><label htmlFor="member-pharmacy-id">Pharmacy</label><select id="member-pharmacy-id" name="pharmacy_id" defaultValue="" required><option value="" disabled>Select pharmacy</option>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select></div>
          <div className="field"><label htmlFor="member-role">Role</label><select id="member-role" name="role" defaultValue="staff"><option value="owner">Owner</option><option value="manager">Manager</option><option value="staff">Staff</option></select></div>
          <div style={{ alignSelf: "end" }}><button className="button button-primary button-small" type="submit" disabled={!!busyId}>{busyId === "membership" ? "Saving…" : "Add staff access"}</button></div>
        </form>
        <p className="auth-footnote">Invite/create the user in Supabase Auth first. Memberships are pharmacy-specific; this does not expose other pharmacies&apos; inventory.</p>
        {members.length > 0 && <div className="table-wrap" style={{ marginTop: 15 }}><table><thead><tr><th>Staff user</th><th>Pharmacy</th><th>Role</th><th>Access</th><th></th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td>{member.user_id.slice(0, 8)}…</td><td>{member.pharmacy?.name ?? "Pharmacy"}</td><td>{member.role}</td><td>{member.is_active ? "Active" : "Inactive"}</td><td><button className="button button-secondary button-small" type="button" disabled={!!busyId} onClick={() => toggleMembership(member)}>{member.is_active ? "Deactivate" : "Reactivate"}</button></td></tr>)}</tbody></table></div>}
      </section>

      <section id="reports" className="panel">
        <div className="panel-heading"><h2>Availability reports</h2><span className="results-count">{reports.filter((report) => report.status === "pending").length} pending</span></div>
        {reports.length ? <div className="result-list">{reports.map((report) => <article className="pharmacy-card" key={report.id}>
          <div className="pharmacy-card-top"><div><h2>{report.pharmacy?.name ?? "Pharmacy report"}</h2><div className="pharmacy-meta"><span>{report.category.replaceAll("_", " ")}</span><span>{formatDate(report.submitted_at)}</span></div></div><span className={`status-pill ${report.status === "pending" ? "status-unknown" : "status-in-stock"}`}><span className="status-dot" />{report.status}</span></div>
          {report.details && <p style={{ color: "#647168", fontSize: 13 }}>{report.details}</p>}
          {report.status === "pending" && <div className="card-actions"><button className="button button-secondary button-small" disabled={!!busyId} onClick={() => reviewReport(report, "reviewed")} type="button">Mark reviewed</button><button className="button button-primary button-small" disabled={!!busyId} onClick={() => reviewReport(report, "resolved")} type="button">Resolve</button><button className="button button-quiet button-small" disabled={!!busyId} onClick={() => reviewReport(report, "dismissed")} type="button">Dismiss</button></div>}
        </article>)}</div> : <p className="results-count">No availability reports have been submitted.</p>}
      </section>

      <section id="freshness" className="panel">
        <div className="panel-heading"><h2>Inventory freshness</h2><span className="results-count">Current expiry: {expiryHours} hour{expiryHours === 1 ? "" : "s"}</span></div>
        <form className="form-grid" onSubmit={saveExpiry}>
          <div className="field"><label htmlFor="expiry-hours">Confirmation expiry (hours)</label><input id="expiry-hours" name="hours" type="number" min="1" max="720" defaultValue={expiryHours} required /></div>
          <div style={{ alignSelf: "end" }}><button className="button button-secondary button-small" type="submit" disabled={!!busyId}>{busyId === "expiry" ? "Saving…" : "Save expiry"}</button></div>
        </form>
        <p className="auth-footnote">Changing this setting affects new inventory confirmations. Existing records keep their saved expiry timestamps.</p>
      </section>
    </div>
  );
}
