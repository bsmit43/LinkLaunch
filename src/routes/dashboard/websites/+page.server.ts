import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/auth/login?redirect=/dashboard/websites');
	}

	// In dev mode, fetch all websites (since dev user ID won't match real user)
	// In production, filter by actual user ID
	let query = locals.supabase
		.from('websites')
		.select('*')
		.order('created_at', { ascending: false });

	if (!dev) {
		query = query.eq('user_id', user.id);
	}

	const { data: websites, error } = await query;

	if (error) {
		console.error('Error fetching websites:', error);
		return { websites: [] };
	}

	// Fetch submission counts for all websites
	const websiteIds = (websites ?? []).map(w => w.id);

	if (websiteIds.length === 0) {
		return { websites: [] };
	}

	// Get submission counts grouped by website and status
	const { data: submissions } = await locals.supabase
		.from('submissions')
		.select('website_id, status')
		.in('website_id', websiteIds);

	// Calculate counts per website
	const countsByWebsite: Record<string, { total: number; approved: number; pending: number }> = {};

	for (const sub of submissions ?? []) {
		if (!countsByWebsite[sub.website_id]) {
			countsByWebsite[sub.website_id] = { total: 0, approved: 0, pending: 0 };
		}
		countsByWebsite[sub.website_id].total++;
		if (sub.status === 'approved') {
			countsByWebsite[sub.website_id].approved++;
		} else if (['pending', 'queued', 'in_progress', 'submitted'].includes(sub.status)) {
			countsByWebsite[sub.website_id].pending++;
		}
	}

	// Attach counts to websites
	const websitesWithCounts = (websites ?? []).map(w => ({
		...w,
		submission_count: countsByWebsite[w.id]?.total ?? 0,
		approved_count: countsByWebsite[w.id]?.approved ?? 0,
		pending_count: countsByWebsite[w.id]?.pending ?? 0
	}));

	return { websites: websitesWithCounts };
};
