"use client";

import { useState, type FormEvent } from "react";
import type { PharmacyMembership } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { NEIGHBORHOODS } from "@/lib/constants";

type Pharmacy = NonNullable<PharmacyMembership["pharmacy"]>;

export function StaffProfileForm({ pharmacyId, pharmacy }: { pharmacyId: string; pharmacy: Pharmacy }) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const contact_email = String(formData.get("contact_email") ?? "").trim();
    const hoursText = String(formData.get("opening_hours") ?? "").trim();
    if (name.length < 2 || address.length < 5 || !neighborhood || phone.length < 7) {
      setSuccess(false); setMessage("Check the pharmacy name, address, neighborhood, and phone number."); return;
    }
    const opening_hours: Record<string, string> = {};
    for (const line of hoursText.split("\n")) {
      if (!line.trim()) continue;
      const separator = line.indexOf(":");
      if (separator < 1) { setSuccess(false); setMessage("Enter opening hours one per line, such as Mon: 08:00–18:00."); return; }
      opening_hours[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
    }
    setBusy(true); setMessage("");
    const { error } = await client.from("pharmacies").update({ name, address, neighborhood, phone, contact_email: contact_email || null, opening_hours }).eq("id", pharmacyId);
    setBusy(false);
    setSuccess(!error);
    setMessage(error ? "Profile update could not be saved. Confirm your access and try again." : "Pharmacy profile updated.");
  }

  const hours = Object.entries(pharmacy.opening_hours ?? {}).map(([day, time]) => `${day}: ${time}`).join("\n");
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="field"><label htmlFor="profile-name">Pharmacy name</label><input id="profile-name" name="name" defaultValue={pharmacy.name} required maxLength={120} /></div>
        <div className="field"><label htmlFor="profile-phone">Phone</label><input id="profile-phone" name="phone" type="tel" defaultValue={pharmacy.phone ?? ""} required maxLength={30} /></div>
        <div className="field"><label htmlFor="profile-neighborhood">Neighborhood</label><select id="profile-neighborhood" name="neighborhood" defaultValue={pharmacy.neighborhood ?? ""} required><option value="" disabled>Select neighborhood</option>{NEIGHBORHOODS.map((area) => <option key={area} value={area}>{area}</option>)}</select></div>
        <div className="field"><label htmlFor="profile-email">Contact email</label><input id="profile-email" name="contact_email" type="email" defaultValue={pharmacy.contact_email ?? ""} maxLength={200} /></div>
        <div className="field span-2"><label htmlFor="profile-address">Address</label><input id="profile-address" name="address" defaultValue={pharmacy.address} required maxLength={250} /></div>
        <div className="field span-2"><label htmlFor="profile-hours">Opening hours <span style={{ fontWeight: 400 }}>(one day per line, e.g. Mon: 08:00–18:00)</span></label><textarea id="profile-hours" name="opening_hours" defaultValue={hours} maxLength={1000} /></div>
      </div>
      <div style={{ marginTop: 15 }}><button className="button button-secondary button-small" type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></div>
      {message && <p className={success ? "form-success" : "form-error"} role="status">{message}</p>}
    </form>
  );
}
