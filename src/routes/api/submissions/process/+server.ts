import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WORKER_URL, CRON_SECRET } from '$env/static/private';

/**
 * POST /api/submissions/process
 * Manually trigger the submission queue processor.
 * This calls the Render worker to process pending submissions.
 */
export const POST: RequestHandler = async ({ locals }) => {
	// Check authentication
	const { data: { user } } = await locals.supabase.auth.getUser();

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Check if worker URL is configured
	if (!WORKER_URL) {
		throw error(500, 'Worker URL not configured');
	}

	try {
		console.log('Triggering submission queue processing...');

		const response = await fetch(`${WORKER_URL}/process-queue`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${CRON_SECRET}`
			},
			body: JSON.stringify({
				source: 'manual',
				triggered_by: user.id,
				triggered_at: new Date().toISOString()
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			throw error(response.status, errorData.error || 'Worker request failed');
		}

		const result = await response.json();

		return json({
			success: true,
			processed: result.processed || 0,
			message: result.message || `Processed ${result.processed || 0} submissions`,
			results: result.results || []
		});

	} catch (err) {
		console.error('Error triggering worker:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, err instanceof Error ? err.message : 'Failed to trigger worker');
	}
};
