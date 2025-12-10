import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const session = await locals.safeGetSession();

	if (!session?.user) {
		return {
			haroOpportunities: [],
			newsletterOutreach: [],
			communityOpportunities: [],
			stats: {
				haro: { pending: 0, sent: 0, published: 0 },
				newsletters: { draft: 0, sent: 0, featured: 0 },
				community: { pending: 0, posted: 0, skipped: 0 }
			}
		};
	}

	const userId = session.user.id;

	// Fetch HARO opportunities
	const { data: haroData } = await supabase
		.from('haro_pitches')
		.select(`
			*,
			query:haro_queries(*),
			website:websites(name, url)
		`)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(20);

	// Fetch newsletter outreach
	const { data: newsletterData } = await supabase
		.from('newsletter_outreach')
		.select('*')
		.in('website_id',
			(await supabase.from('websites').select('id').eq('user_id', userId)).data?.map(w => w.id) || []
		)
		.order('subscribers_count', { ascending: false })
		.limit(20);

	// Fetch community opportunities
	const { data: communityData } = await supabase
		.from('qa_opportunities')
		.select(`
			*,
			website:websites!inner(user_id, name)
		`)
		.eq('website.user_id', userId)
		.order('found_at', { ascending: false })
		.limit(20);

	// Calculate stats
	const haroStats = {
		pending: haroData?.filter(h => h.status === 'pending_review').length || 0,
		sent: haroData?.filter(h => h.status === 'sent').length || 0,
		published: haroData?.filter(h => h.status === 'published').length || 0
	};

	const newsletterStats = {
		draft: newsletterData?.filter(n => n.status === 'draft').length || 0,
		sent: newsletterData?.filter(n => n.status === 'sent').length || 0,
		featured: newsletterData?.filter(n => n.status === 'featured').length || 0
	};

	const communityStats = {
		pending: communityData?.filter(c => c.status === 'pending_review').length || 0,
		posted: communityData?.filter(c => c.status === 'posted').length || 0,
		skipped: communityData?.filter(c => c.status === 'skipped').length || 0
	};

	return {
		haroOpportunities: haroData || [],
		newsletterOutreach: newsletterData || [],
		communityOpportunities: communityData || [],
		stats: {
			haro: haroStats,
			newsletters: newsletterStats,
			community: communityStats
		}
	};
};
