import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const supabase = createClient(url, key);
export async function authorizedFetch(path: string, init?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Entre na sua conta para continuar");
  return fetch(path, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${session.access_token}` } });
}
