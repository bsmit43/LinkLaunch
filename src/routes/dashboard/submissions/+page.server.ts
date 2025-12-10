import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import { DIRECTORIES } from '$lib/data/directories';

export const load: PageServerLoad = async ({ url, locals }) => {
	const websiteId = url.searchParams.get('website');

	// Build query - explicitly set high limit to get all submissions
	let query = locals.supabase
		.from('submissions')
		.select(`
			*,
			website:websites(id, name, url)
		`)
		.order('created_at', { ascending: false })
		.limit(1000);

	// Filter by website if provided
	if (websiteId) {
		query = query.eq('website_id', websiteId);
	}

	const { data: submissions, error } = await query;

	// Enrich submissions with directory data from static file
	// (directories table may not have all entries, but static file does)
	const directoriesMap = new Map(DIRECTORIES.map(d => [d.id, d]));
	const enrichedSubmissions = (submissions || []).map(sub => ({
		...sub,
		directory: directoriesMap.get(sub.directory_id) || null
	}));

	// Get website name if filtering
	let websiteFilter = null;
	if (websiteId) {
		const { data: website } = await locals.supabase
			.from('websites')
			.select('id, name')
			.eq('id', websiteId)
			.single();
		websiteFilter = website;
	}

	// In dev mode with no data, return mock submissions if they exist
	if (dev && (!submissions || submissions.length === 0)) {
		// Return empty for now - submissions will be created via the submit flow
		return {
			submissions: [],
			websiteFilter
		};
	}

	return {
		submissions: enrichedSubmissions,
		websiteFilter
	};
};
