import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const config = getSupabasePublicEnv();
  if (!config) return null;

  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const isPublicHttps = forwardedProtocol === "https";
  return createServerClient(config.url, config.anonKey, {
    cookieOptions: { sameSite: isPublicHttps ? "none" : "lax", secure: isPublicHttps },
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; the proxy refreshes sessions and writes them.
        }
      },
    },
  });
}
