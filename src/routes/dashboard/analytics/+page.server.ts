import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const session = await locals.safeGetSession();

	if (!session?.user) {
		return {
			stats: {
				totalBacklinks: 0,
				doFollowBacklinks: 0,
				averageDA: 0,
				submissionsThisMonth: 0,
				approvalRate: 0,
				syndicatedArticles: 0,
				featuresWon: 0,
				socialPosts: 0
			},
			backlinksBySource: [],
			submissionsByStatus: [],
			recentBacklinks: []
		};
	}

	const userId = session.user.id;

	// Get user's website IDs
	const { data: websites } = await supabase
		.from('websites')
		.select('id')
		.eq('user_id', userId);

	const websiteIds = websites?.map(w => w.id) || [];

	// Fetch all backlinks
	const { data: backlinks } = await supabase
		.from('backlinks')
		.select('*')
		.in('website_id', websiteIds)
		.order('created_at', { ascending: false });

	// Fetch all submissions
	const { data: submissions } = await supabase
		.from('submissions')
		.select('*')
		.eq('user_id', userId);

	// Fetch syndicated content
	const { data: syndications } = await supabase
		.from('content_syndications')
		.select('*')
		.in('website_id', websiteIds)
		.eq('status', 'published');

	// Fetch features (HARO + Newsletter)
	const { data: haroPublished } = await supabase
		.from('haro_pitches')
		.select('*')
		.eq('user_id', userId)
		.eq('status', 'published');

	const { data: newsletterFeatured } = await supabase
		.from('newsletter_outreach')
		.select('*')
		.in('website_id', websiteIds)
		.eq('status', 'featured');

	// Fetch social posts
	const { data: socialPosts } = await supabase
		.from('social_posts')
		.select('*')
		.eq('user_id', userId)
		.eq('status', 'posted');

	// Calculate stats
	const allBacklinks = backlinks || [];
	const allSubmissions = submissions || [];

	const totalBacklinks = allBacklinks.length;
	const doFollowBacklinks = allBacklinks.filter(b => b.link_type === 'dofollow').length;

	const daValues = allBacklinks.filter(b => b.source_domain_authority).map(b => b.source_domain_authority);
	const averageDA = daValues.length > 0 ? Math.round(daValues.reduce((a, b) => a + b, 0) / daValues.length) : 0;

	const thisMonth = new Date();
	thisMonth.setDate(1);
	const submissionsThisMonth = allSubmissions.filter(s =>
		new Date(s.created_at) >= thisMonth
	).length;

	const approvedCount = allSubmissions.filter(s => s.status === 'approved').length;
	const completedCount = allSubmissions.filter(s => ['approved', 'rejected', 'failed'].includes(s.status)).length;
	const approvalRate = completedCount > 0 ? Math.round((approvedCount / completedCount) * 100) : 0;

	// Group backlinks by source type
	const sourceGroups: Record<string, { count: number; dofollow: number; das: number[] }> = {};

	for (const backlink of allBacklinks) {
		const domain = backlink.source_domain || 'Unknown';
		let sourceName = domain;

		// Categorize by domain
		if (domain.includes('medium.com')) sourceName = 'Medium';
		else if (domain.includes('dev.to')) sourceName = 'Dev.to';
		else if (domain.includes('hashnode')) sourceName = 'Hashnode';
		else if (domain.includes('linkedin')) sourceName = 'LinkedIn';
		else sourceName = 'Directories';

		if (!sourceGroups[sourceName]) {
			sourceGroups[sourceName] = { count: 0, dofollow: 0, das: [] };
		}

		sourceGroups[sourceName].count++;
		if (backlink.link_type === 'dofollow') {
			sourceGroups[sourceName].dofollow++;
		}
		if (backlink.source_domain_authority) {
			sourceGroups[sourceName].das.push(backlink.source_domain_authority);
		}
	}

	const backlinksBySource = Object.entries(sourceGroups).map(([name, data]) => ({
		name,
		count: data.count,
		dofollow: data.dofollow,
		avgDA: data.das.length > 0 ? Math.round(data.das.reduce((a, b) => a + b, 0) / data.das.length) : 0,
		icon: name === 'Medium' ? '📝' : name === 'Dev.to' ? '👨‍💻' : name === 'Hashnode' ? '📗' : name === 'LinkedIn' ? '💼' : '🔗'
	})).sort((a, b) => b.count - a.count);

	// Submission funnel
	const statusCounts: Record<string, number> = {};
	for (const sub of allSubmissions) {
		const status = sub.status || 'unknown';
		statusCounts[status] = (statusCounts[status] || 0) + 1;
	}

	const totalSubs = allSubmissions.length || 1;
	const submissionsByStatus = [
		{ name: 'Approved', count: statusCounts['approved'] || 0, percentage: ((statusCounts['approved'] || 0) / totalSubs) * 100, color: 'bg-green-500' },
		{ name: 'Submitted', count: statusCounts['submitted'] || 0, percentage: ((statusCounts['submitted'] || 0) / totalSubs) * 100, color: 'bg-blue-500' },
		{ name: 'Pending', count: statusCounts['pending'] || 0, percentage: ((statusCounts['pending'] || 0) / totalSubs) * 100, color: 'bg-yellow-500' },
		{ name: 'Failed', count: statusCounts['failed'] || 0, percentage: ((statusCounts['failed'] || 0) / totalSubs) * 100, color: 'bg-red-500' },
		{ name: 'Rejected', count: statusCounts['rejected'] || 0, percentage: ((statusCounts['rejected'] || 0) / totalSubs) * 100, color: 'bg-orange-500' }
	].filter(s => s.count > 0);

	return {
		stats: {
			totalBacklinks,
			doFollowBacklinks,
			averageDA,
			submissionsThisMonth,
			approvalRate,
			syndicatedArticles: syndications?.length || 0,
			featuresWon: (haroPublished?.length || 0) + (newsletterFeatured?.length || 0),
			socialPosts: socialPosts?.length || 0
		},
		backlinksBySource,
		submissionsByStatus,
		recentBacklinks: allBacklinks.slice(0, 20)
	};
};
