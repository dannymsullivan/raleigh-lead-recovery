import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAuthEnvironment(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return url && key ? { url, key } : null;
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getAuthEnvironment());
}

export async function getSupabaseAuth() {
  const environment = getAuthEnvironment();
  if (!environment) {
    throw new Error("Missing SUPABASE_PUBLISHABLE_KEY for customer authentication");
  }

  const cookieStore = await cookies();

  return createServerClient(environment.url, environment.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them.
        }
      }
    }
  });
}
