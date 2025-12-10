import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad, Actions } from './$types';
import type { SubmissionInsert } from '$lib/types/database';
import { DIRECTORIES } from '$lib/data/directories';

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
			const sortedDirectories = [...DIRECTORIES]
				.filter(d => d.is_active)
				.sort((a, b) => b.domain_authority - a.domain_authority);

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
				submissions: [],
				directories: sortedDirectories,
				submittedDirectoryIds: []
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

	// Load directories for Submit tab
	const sortedDirectories = [...DIRECTORIES]
		.filter(d => d.is_active)
		.sort((a, b) => b.domain_authority - a.domain_authority);

	// Get ALL directory IDs that have submissions (can't submit new)
	// Use "Retry Failed" button to reprocess failed submissions
	const submittedDirectoryIds = submissions?.map(s => s.directory_id) || [];

	return {
		website,
		stats,
		submissions: submissions ?? [],
		directories: sortedDirectories,
		submittedDirectoryIds
	};
};

export const actions: Actions = {
	submitDirectories: async ({ request, params, locals }) => {
		const { id } = params;
		const formData = await request.formData();
		const directoryIds = [...new Set(formData.getAll('directories') as string[])];

		if (directoryIds.length === 0) {
			return fail(400, { error: 'Please select at least one directory' });
		}

		// Get user
		const { data: { user } } = await locals.supabase.auth.getUser();

		// In dev mode, use a mock user ID
		const userId = user?.id || (dev ? 'dev-user-00000000-0000-0000-0000-000000000000' : null);

		if (!userId) {
			return fail(401, { error: 'You must be logged in' });
		}

		// Get ALL existing submissions to filter out duplicates
		const { data: existingSubmissions } = await locals.supabase
			.from('submissions')
			.select('directory_id')
			.eq('website_id', id)
			.in('directory_id', directoryIds);

		const existingIds = new Set(existingSubmissions?.map(s => s.directory_id) || []);
		const newDirectoryIds = directoryIds.filter(dirId => !existingIds.has(dirId));

		if (newDirectoryIds.length === 0) {
			return fail(400, {
				error: 'All selected directories already have submissions for this website. Use "Retry Failed" to reprocess failed submissions.',
				alreadySubmitted: directoryIds.length
			});
		}

		// Create submissions only for new directories
		const newSubmissions: SubmissionInsert[] = newDirectoryIds.map(directoryId => ({
			website_id: id,
			directory_id: directoryId,
			user_id: userId,
			status: 'pending' as const
		}));

		const { error: insertError } = await locals.supabase
			.from('submissions')
			.insert(newSubmissions as any);

		if (insertError) {
			console.error('Error creating submissions:', insertError);
			return fail(500, { error: 'Failed to create submissions' });
		}

		const skipped = directoryIds.length - newDirectoryIds.length;
		return {
			success: true,
			count: newDirectoryIds.length,
			skipped: skipped > 0 ? skipped : undefined
		};
	},

	retryFailed: async ({ params, locals }) => {
		const { id } = params;

		// Get user
		const { data: { user } } = await locals.supabase.auth.getUser();
		const userId = user?.id || (dev ? 'dev-user-00000000-0000-0000-0000-000000000000' : null);

		if (!userId) {
			return fail(401, { error: 'You must be logged in' });
		}

		// Reset all failed submissions to pending
		const { error: updateError, count } = await locals.supabase
			.from('submissions')
			.update({
				status: 'pending',
				error_message: null,
				retry_count: 0,
				next_retry_at: null
			})
			.eq('website_id', id)
			.eq('status', 'failed');

		if (updateError) {
			console.error('Error resetting failed submissions:', updateError);
			return fail(500, { error: 'Failed to reset submissions' });
		}

		return { success: true, resetCount: count || 0 };
	},

	cancelPending: async ({ request, params, locals }) => {
		const { id } = params;
		const formData = await request.formData();
		const submissionId = formData.get('submissionId') as string;

		if (!submissionId) {
			return fail(400, { error: 'Submission ID required' });
		}

		// Get user
		const { data: { user } } = await locals.supabase.auth.getUser();
		const userId = user?.id || (dev ? 'dev-user-00000000-0000-0000-0000-000000000000' : null);

		if (!userId) {
			return fail(401, { error: 'You must be logged in' });
		}

		// Delete the pending submission (only allows pending status)
		const { error: deleteError } = await locals.supabase
			.from('submissions')
			.delete()
			.eq('id', submissionId)
			.eq('website_id', id)
			.eq('status', 'pending');

		if (deleteError) {
			console.error('Error canceling submission:', deleteError);
			return fail(500, { error: 'Failed to cancel submission' });
		}

		return { success: true, cancelled: true };
	}
};
