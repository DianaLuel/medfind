"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    setBusy(true);
    await client.auth.signOut();
    router.push("/staff/sign-in");
    router.refresh();
  }
  return <button className="button button-secondary button-small" onClick={signOut} disabled={busy} type="button"><LogOut size={14} aria-hidden="true" />{busy ? "Signing out…" : "Sign out"}</button>;
}
