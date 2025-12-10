import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Database } from '$lib/types/database';
import { dev } from '$app/environment';
import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

// Dev bypass user - full access to everything
const DEV_USER = {
	id: 'dev-user-00000000-0000-0000-0000-000000000000',
	email: 'dev@linklaunch.local',
	aud: 'authenticated',
	role: 'authenticated',
	email_confirmed_at: new Date().toISOString(),
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	user_metadata: {
		full_name: 'Dev User',
		avatar_url: null
	},
	app_metadata: {
		provider: 'dev',
		subscription_tier: 'galaxy'
	}
} as const;

const DEV_SESSION = {
	access_token: 'dev-access-token',
	refresh_token: 'dev-refresh-token',
	expires_in: 3600,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	token_type: 'bearer',
	user: DEV_USER
} as const;

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll() {
					return event.cookies.getAll();
				},
				setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	event.locals.safeGetSession = async () => {
		// Dev bypass - return mock session with full access
		if (dev) {
			return { session: DEV_SESSION as any, user: DEV_USER as any };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Protect dashboard routes
	if (event.url.pathname.startsWith('/dashboard')) {
		if (!session) {
			return new Response(null, {
				status: 303,
				headers: { location: '/auth/login?redirect=' + event.url.pathname }
			});
		}
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
