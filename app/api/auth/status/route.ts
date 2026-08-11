export async function GET(): Promise<Response> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return Response.json({ phoneAuthEnabled: false }, { status: 503 });

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store"
    });
    if (!response.ok) return Response.json({ phoneAuthEnabled: false }, { status: 502 });

    const settings = await response.json() as { external?: { phone?: boolean } };
    return Response.json({ phoneAuthEnabled: settings.external?.phone === true });
  } catch {
    return Response.json({ phoneAuthEnabled: false }, { status: 502 });
  }
}
