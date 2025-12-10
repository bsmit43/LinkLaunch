import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch all submissions for the user
	const { data: submissions } = await locals.supabase
		.from('submissions')
		.select('id, status, listing_url, created_at, website:websites(name), directory_id')
		.order('created_at', { ascending: false })
		.limit(1000);

	const allSubmissions = submissions ?? [];

	// Calculate stats
	const stats = {
		total: allSubmissions.length,
		approved: allSubmissions.filter(s => s.status === 'approved').length,
		pending: allSubmissions.filter(s => ['pending', 'queued', 'in_progress', 'submitted'].includes(s.status)).length,
		backlinks: allSubmissions.filter(s => s.listing_url).length
	};

	// Get recent activity (last 10 submissions)
	const recentActivity = allSubmissions.slice(0, 10).map(s => ({
		action: `Submitted to directory`,
		directory: s.directory_id?.substring(0, 8) + '...',
		website: (s.website as any)?.name ?? 'Unknown',
		status: s.status,
		time: getRelativeTime(new Date(s.created_at))
	}));

	return { stats, recentActivity };
};

function getRelativeTime(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
}
