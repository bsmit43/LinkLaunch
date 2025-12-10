import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from '$lib/types/database';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return cookies.getAll();
				},
				setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);
}
