import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '$lib/types/database';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

export function createSupabaseBrowserClient() {
	return createBrowserClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY
	);
}
