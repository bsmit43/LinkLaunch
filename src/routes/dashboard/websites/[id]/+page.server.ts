import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	const { data: website, error: dbError } = await locals.supabase
		.from('websites')
		.select('*')
		.eq('id', id)
		.single();

	if (dbError || !website) {
		// In dev mode, return mock data for testing
		if (dev) {
			return {
				website: {
					id,
					user_id: 'dev-user-00000000-0000-0000-0000-000000000000',
					name: 'Dev Test Website',
					url: 'https://example.com',
					tagline: 'A test website for development',
					description_short: 'This is a mock website for development testing.',
					description_medium: 'This is a more detailed description of the mock website used during development.',
					description_long: null,
					industry: 'SaaS & Software',
					category: 'Developer Tools',
					business_type: 'b2b' as const,
					target_audience: 'Developers',
					keywords: ['development', 'testing', 'mock'],
					logo_url: null,
					screenshot_url: null,
					video_url: null,
					twitter_url: null,
					linkedin_url: null,
					github_url: null,
					producthunt_url: null,
					contact_email: 'dev@example.com',
					founder_name: 'Dev User',
					founder_email: null,
					founder_title: 'Developer',
					competitors: null,
					status: 'active' as const,
					onboarding_completed: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				},
				stats: { total: 0, approved: 0, pending: 0, in_progress: 0, submitted: 0, failed: 0, backlinks: 0 },
				submissions: []
			};
		}
		throw error(404, 'Website not found');
	}

	// Fetch all submissions for this website with directory info
	const { data: submissions } = await locals.supabase
		.from('submissions')
		.select(`
			*,
			directory:directories(name, url, domain_authority)
		`)
		.eq('website_id', id)
		.order('created_at', { ascending: false });

	const stats = {
		total: submissions?.length ?? 0,
		pending: submissions?.filter(s => s.status === 'pending').length ?? 0,
		in_progress: submissions?.filter(s => s.status === 'in_progress').length ?? 0,
		submitted: submissions?.filter(s => s.status === 'submitted').length ?? 0,
		approved: submissions?.filter(s => s.status === 'approved').length ?? 0,
		failed: submissions?.filter(s => s.status === 'failed').length ?? 0,
		backlinks: submissions?.filter(s => s.listing_url).length ?? 0
	};

	return { website, stats, submissions: submissions ?? [] };
};
