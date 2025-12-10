import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const session = await locals.safeGetSession();

	if (!session?.user) {
		return {
			syndications: [],
			socialPosts: [],
			stats: {
				syndicated: 0,
				backlinks: 0,
				scheduled: 0,
				posted: 0
			}
		};
	}

	const userId = session.user.id;

	// Get user's website IDs
	const { data: websites } = await supabase
		.from('websites')
		.select('id')
		.eq('user_id', userId);

	const websiteIds = websites?.map(w => w.id) || [];

	// Fetch syndications
	const { data: syndicationData } = await supabase
		.from('content_syndications')
		.select('*')
		.in('website_id', websiteIds)
		.order('created_at', { ascending: false })
		.limit(20);

	// Fetch social posts
	const { data: socialData } = await supabase
		.from('social_posts')
		.select('*')
		.eq('user_id', userId)
		.order('scheduled_at', { ascending: true })
		.limit(30);

	// Fetch backlinks from syndication
	const { data: backlinksData } = await supabase
		.from('backlinks')
		.select('id')
		.in('website_id', websiteIds)
		.eq('is_from_submission', true);

	// Calculate stats
	const stats = {
		syndicated: syndicationData?.filter(s => s.status === 'published').length || 0,
		backlinks: backlinksData?.length || 0,
		scheduled: socialData?.filter(s => s.status === 'scheduled').length || 0,
		posted: socialData?.filter(s => s.status === 'posted').length || 0
	};

	return {
		syndications: syndicationData || [],
		socialPosts: socialData || [],
		stats
	};
};
