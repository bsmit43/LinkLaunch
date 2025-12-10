import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface SubmissionRow {
	id: string;
	status: string;
	error_message: string | null;
	updated_at: string;
	created_at: string;
	submitted_at: string | null;
	listing_url: string | null;
	retry_count: number;
	directory: { id: string; name: string; url: string } | null;
}

/**
 * GET /api/submissions/status?websiteId=xxx
 * Returns current submission stats and recently changed submissions for polling.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const { data: { user } } = await locals.supabase.auth.getUser();

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const websiteId = url.searchParams.get('websiteId');
	if (!websiteId) {
		throw error(400, 'Missing websiteId parameter');
	}

	try {
		// Get all submissions for this website with directory info
		const { data, error: fetchError } = await locals.supabase
			.from('submissions')
			.select(`
				id,
				status,
				error_message,
				updated_at,
				created_at,
				submitted_at,
				listing_url,
				retry_count,
				directory:directories(id, name, url)
			`)
			.eq('website_id', websiteId)
			.eq('user_id', user.id)
			.order('updated_at', { ascending: false })
			.limit(100);

		if (fetchError) {
			console.error('Error fetching submissions:', fetchError);
			throw error(500, 'Failed to fetch submissions');
		}

		const submissions = (data ?? []) as unknown as SubmissionRow[];

		// Calculate stats
		const stats = {
			pending: submissions.filter(s => s.status === 'pending').length,
			in_progress: submissions.filter(s => s.status === 'in_progress').length,
			submitted: submissions.filter(s => s.status === 'submitted').length,
			approved: submissions.filter(s => s.status === 'approved').length,
			failed: submissions.filter(s => s.status === 'failed').length,
			total: submissions.length,
			backlinks: submissions.filter(s => s.listing_url).length
		};

		// Get submissions changed in the last 60 seconds (for live polling)
		const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
		const recentlyChanged = submissions.filter(s => s.updated_at > sixtySecondsAgo);

		return json({
			stats,
			recentlyChanged: recentlyChanged.map(s => ({
				id: s.id,
				status: s.status,
				directory: s.directory,
				error_message: s.error_message,
				updated_at: s.updated_at,
				listing_url: s.listing_url,
				retry_count: s.retry_count
			})),
			timestamp: new Date().toISOString()
		});

	} catch (err) {
		console.error('Error in status endpoint:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Failed to get submission status');
	}
};
