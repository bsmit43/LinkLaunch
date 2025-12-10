import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession();
	const userId = session?.user?.id;

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

	// Fetch opportunity stats
	let opportunityStats = {
		haro: 0,
		newsletters: 0,
		community: 0,
		social: 0
	};

	if (userId) {
		// Get website IDs
		const { data: websites } = await locals.supabase
			.from('websites')
			.select('id')
			.eq('user_id', userId);

		const websiteIds = websites?.map(w => w.id) || [];

		// HARO pitches pending
		const { count: haroCount } = await locals.supabase
			.from('haro_pitches')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('status', 'pending_review');

		// Newsletter drafts
		const { count: newsletterCount } = await locals.supabase
			.from('newsletter_outreach')
			.select('*', { count: 'exact', head: true })
			.in('website_id', websiteIds)
			.eq('status', 'draft');

		// Community opportunities pending
		const { count: communityCount } = await locals.supabase
			.from('qa_opportunities')
			.select('*', { count: 'exact', head: true })
			.in('website_id', websiteIds)
			.eq('status', 'pending_review');

		// Scheduled social posts
		const { count: socialCount } = await locals.supabase
			.from('social_posts')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId)
			.eq('status', 'scheduled');

		opportunityStats = {
			haro: haroCount || 0,
			newsletters: newsletterCount || 0,
			community: communityCount || 0,
			social: socialCount || 0
		};
	}

	return { stats, recentActivity, opportunityStats };
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
