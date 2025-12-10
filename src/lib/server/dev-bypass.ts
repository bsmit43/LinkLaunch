import { dev } from '$app/environment';
import type { Database } from '$lib/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Dev bypass profile with full galaxy tier access
export const DEV_PROFILE: Profile = {
	id: 'dev-user-00000000-0000-0000-0000-000000000000',
	email: 'dev@linklaunch.local',
	full_name: 'Dev User',
	avatar_url: null,
	company_name: 'LinkLaunch Dev',
	subscription_tier: 'galaxy',
	subscription_status: 'active',
	stripe_customer_id: null,
	stripe_subscription_id: null,
	monthly_submissions_limit: 999999,
	monthly_submissions_used: 0,
	limits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	email_notifications: true,
	weekly_report: true,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
};

// Helper to check if dev bypass is active
export function isDevBypass(): boolean {
	return dev;
}

// Helper to get dev profile or fetch real one
export async function getProfileWithDevBypass(
	supabase: any,
	userId: string
): Promise<Profile | null> {
	if (dev) {
		return DEV_PROFILE;
	}

	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (error) {
		console.error('Error fetching profile:', error);
		return null;
	}

	return data;
}
