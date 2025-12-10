import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad, Actions } from './$types';
import type { SubmissionInsert } from '$lib/types/database';
import { DIRECTORIES } from '$lib/data/directories';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// Load website
	const { data: website, error: websiteError } = await locals.supabase
		.from('websites')
		.select('*')
		.eq('id', id)
		.single();

	if (websiteError || !website) {
		if (dev) {
			// Return mock website in dev mode
			const mockWebsite = {
				id,
				name: 'Dev Test Website',
				url: 'https://example.com',
				industry: 'SaaS & Software',
				business_type: 'b2b'
			};

			return {
				website: mockWebsite,
				directories: DIRECTORIES.filter(d => d.is_active),
				existingSubmissions: []
			};
		}
		throw error(404, 'Website not found');
	}

	// Load existing submissions for this website to exclude them
	// Use high limit to get all submissions (default is too low)
	const { data: existingSubmissions } = await locals.supabase
		.from('submissions')
		.select('directory_id')
		.eq('website_id', id)
		.limit(1000);

	// Use the static DIRECTORIES data (405+ directories)
	// Sort by domain_authority descending
	const sortedDirectories = [...DIRECTORIES]
		.filter(d => d.is_active)
		.sort((a, b) => b.domain_authority - a.domain_authority);

	return {
		website,
		directories: sortedDirectories,
		existingSubmissions: existingSubmissions?.map((s: { directory_id: string }) => s.directory_id) || []
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const { id } = params;
		const formData = await request.formData();
		const directoryIds = formData.getAll('directories') as string[];

		if (directoryIds.length === 0) {
			return { success: false, error: 'Please select at least one directory' };
		}

		// Get user
		const { data: { user } } = await locals.supabase.auth.getUser();

		// In dev mode, use a mock user ID
		const userId = user?.id || (dev ? 'dev-user-00000000-0000-0000-0000-000000000000' : null);

		if (!userId) {
			return { success: false, error: 'You must be logged in' };
		}

		// Create submissions
		const submissions: SubmissionInsert[] = directoryIds.map(directoryId => ({
			website_id: id,
			directory_id: directoryId,
			user_id: userId,
			status: 'pending' as const
		}));

		const { error: insertError } = await locals.supabase
			.from('submissions')
			.insert(submissions as any);

		if (insertError) {
			console.error('Error creating submissions:', insertError);
			return { success: false, error: 'Failed to create submissions' };
		}

		return { success: true, count: directoryIds.length };
	}
};
