"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const client = createSupabaseBrowserClient();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) { setMessage("Sign-in is unavailable until an operator configures Supabase. No test or preview account is enabled."); return; }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!email || !password) { setMessage("Enter your email and password."); return; }
    setBusy(true); setMessage("");
    const { error } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMessage("Sign-in could not be completed. Check your details or contact your pharmacy administrator."); return; }
    router.push("/staff");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {!client && <div className="notice">Supabase is not configured yet. Follow the <Link className="text-link" href="/setup">setup guide</Link>; live staff authentication remains disabled until then.</div>}
      <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" required autoComplete="username" maxLength={200} /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" maxLength={128} /></div>
      <button className="button button-primary" disabled={busy || !client} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
      {message && <p className="form-error" role="alert">{message}</p>}
    </form>
  );
}
