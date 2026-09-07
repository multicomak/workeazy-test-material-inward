import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const URL_ENV = 'NEXT_PUBLIC_SUPABASE_URL';
const KEY_ENV = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env[URL_ENV] && process.env[KEY_ENV]);
}

export async function createClient() {
  const url = process.env[URL_ENV];
  const key = process.env[KEY_ENV];
  if (!url || !key) {
    throw new Error(
      `Supabase is not configured. Set ${URL_ENV} and ${KEY_ENV} (see .env.example).`,
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the middleware/route handler owns cookies.
        }
      },
    },
  });
}
