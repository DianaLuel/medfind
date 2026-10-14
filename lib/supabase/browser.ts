import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicEnv();
  if (!config) return null;
  const isHttpsPage = typeof window !== "undefined" && window.location.protocol === "https:";
  return createBrowserClient(config.url, config.anonKey, {
    cookieOptions: { sameSite: isHttpsPage ? "none" : "lax", secure: isHttpsPage },
  });
}
