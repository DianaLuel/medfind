"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { NEIGHBORHOODS } from "@/lib/constants";

const applicationSchema = z.object({
  pharmacy_name: z.string().trim().min(2, "Enter the pharmacy's business name.").max(120),
  contact_name: z.string().trim().min(2, "Enter a contact name.").max(100),
  contact_email: z.string().trim().email("Enter a valid contact email.").max(200),
  phone: z.string().trim().min(7, "Enter a phone number with at least 7 digits.").max(30),
  address: z.string().trim().min(5, "Enter the pharmacy address.").max(250),
  neighborhood: z.string().trim().min(2, "Choose a neighborhood.").max(80),
  message: z.string().trim().max(500).optional(),
});

export function PharmacyApplicationForm() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const configured = Boolean(createSupabaseBrowserClient());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!configured) {
      setState("error");
      setMessage("Applications cannot be submitted yet because Supabase is not configured. Please use the setup guide after an operator connects the project.");
      return;
    }
    const formData = new FormData(form);
    const parsed = applicationSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      setState("error");
      setMessage(parsed.error.issues[0]?.message ?? "Please check the form fields.");
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) {
      setState("error");
      setMessage("Supabase settings are unavailable. No application was sent.");
      return;
    }
    setState("sending");
    setMessage("");
    const { error } = await client.from("pharmacy_registrations").insert(parsed.data);
    if (error) {
      setState("error");
      setMessage("Your application could not be sent. Please try again later or contact the directory operator.");
      return;
    }
    setState("success");
    setMessage("Application received for review. It is not a public listing, and no stock information has been added.");
    form.reset();
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Pharmacy details</h2>
      {!configured && <p className="notice" style={{ marginBottom: 16 }}>The directory has not connected its database yet. This form is a preview and will not transmit personal details until Supabase is configured.</p>}
      <div className="form-grid">
        <div className="field"><label htmlFor="pharmacy_name">Pharmacy business name</label><input id="pharmacy_name" name="pharmacy_name" required maxLength={120} autoComplete="organization" /></div>
        <div className="field"><label htmlFor="contact_name">Contact person</label><input id="contact_name" name="contact_name" required maxLength={100} autoComplete="name" /></div>
        <div className="field"><label htmlFor="contact_email">Contact email</label><input id="contact_email" name="contact_email" type="email" required maxLength={200} autoComplete="email" /></div>
        <div className="field"><label htmlFor="phone">Pharmacy phone</label><input id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" /></div>
        <div className="field span-2"><label htmlFor="address">Street address</label><input id="address" name="address" required maxLength={250} autoComplete="street-address" /></div>
        <div className="field"><label htmlFor="neighborhood">Neighborhood</label><select id="neighborhood" name="neighborhood" required defaultValue=""><option value="" disabled>Select a neighborhood</option>{NEIGHBORHOODS.map((area) => <option value={area} key={area}>{area}</option>)}</select></div>
        <div className="field"><label htmlFor="message">Additional information <span style={{ fontWeight: 400 }}>(optional)</span></label><input id="message" name="message" maxLength={500} /></div>
        <div className="span-2" style={{ display: "flex", alignItems: "flex-start", gap: 9, color: "#6d786f", fontSize: 12 }}><input id="consent" type="checkbox" required style={{ marginTop: 3 }} /><label htmlFor="consent">I am authorized to submit these business details for review. I understand that approval is required before a pharmacy appears publicly.</label></div>
      </div>
      <div style={{ marginTop: 18 }}><button className="button button-primary" type="submit" disabled={state === "sending" || !configured}>{state === "sending" ? "Sending…" : "Submit for review"}</button></div>
      {message && <p className={state === "success" ? "form-success" : "form-error"} role="status">{message}</p>}
      <p className="auth-footnote">Only the pharmacy business and its contact details are collected here. This form does not ask for customer or patient information.</p>
    </form>
  );
}
