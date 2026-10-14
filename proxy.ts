import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const config = getSupabasePublicEnv();
  let response = NextResponse.next({ request });
  if (!config) return response;

  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const isPublicHttps = forwardedProtocol === "https";
  const supabase = createServerClient(config.url, config.anonKey, {
    cookieOptions: { sameSite: isPublicHttps ? "none" : "lax", secure: isPublicHttps },
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, {
          ...options,
          sameSite: isPublicHttps ? "none" : "lax",
          secure: isPublicHttps,
        }));
      },
    },
  });

  // Refresh and validate the Supabase session. Authorization is still enforced by RLS and page guards.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*", "/api/search", "/pharmacies/:path*"],
};
