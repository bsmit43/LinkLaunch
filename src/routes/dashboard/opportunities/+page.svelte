<script lang="ts">
	import { onMount } from 'svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';

	export let data;

	let activeTab = 'haro';
	let loading = true;

	// Opportunity data
	let haroOpportunities: any[] = [];
	let newsletterOutreach: any[] = [];
	let communityOpportunities: any[] = [];

	// Stats
	let stats = {
		haro: { pending: 0, sent: 0, published: 0 },
		newsletters: { draft: 0, sent: 0, featured: 0 },
		community: { pending: 0, posted: 0, skipped: 0 }
	};

	const tabs = [
		{ id: 'haro', name: 'HARO & PR', icon: '📰', description: 'Journalist queries & press opportunities' },
		{ id: 'newsletters', name: 'Newsletters', icon: '📧', description: 'Newsletter feature outreach' },
		{ id: 'community', name: 'Community', icon: '💬', description: 'Reddit, Quora & HN opportunities' },
		{ id: 'reviews', name: 'Reviews', icon: '⭐', description: 'G2, Capterra & review management' }
	];

	onMount(async () => {
		await loadOpportunities();
		loading = false;
	});

	async function loadOpportunities() {
		// In a real implementation, this would fetch from the API
		// For now, show placeholder data
		haroOpportunities = [];
		newsletterOutreach = [];
		communityOpportunities = [];
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			pending_review: 'bg-yellow-500/10 text-yellow-400',
			draft: 'bg-blue-500/10 text-blue-400',
			sent: 'bg-purple-500/10 text-purple-400',
			published: 'bg-green-500/10 text-green-400',
			featured: 'bg-green-500/10 text-green-400',
			posted: 'bg-green-500/10 text-green-400',
			skipped: 'bg-gray-500/10 text-gray-400',
			declined: 'bg-red-500/10 text-red-400'
		};
		return colors[status] || 'bg-gray-500/10 text-gray-400';
	}
</script>

<svelte:head>
	<title>Opportunities - LinkLaunch</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Opportunities</h1>
		<p class="text-muted-foreground">
			AI-powered opportunities to get featured in press, newsletters, and communities.
		</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">📰</span>
				<span class="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
					HARO
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.haro.pending} />
			</div>
			<div class="text-sm text-muted-foreground">Pending Pitches</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">📧</span>
				<span class="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
					Newsletters
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.newsletters.draft} />
			</div>
			<div class="text-sm text-muted-foreground">Ready to Send</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">💬</span>
				<span class="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
					Community
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.community.pending} />
			</div>
			<div class="text-sm text-muted-foreground">To Review</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">🎯</span>
				<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
					Total
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.haro.published + stats.newsletters.featured + stats.community.posted} />
			</div>
			<div class="text-sm text-muted-foreground">Features Won</div>
		</MagicCard>
	</div>

	<!-- Tabs -->
	<div class="border-b border-white/10 mb-6">
		<nav class="flex gap-4 overflow-x-auto pb-px">
			{#each tabs as tab}
				<button
					on:click={() => activeTab = tab.id}
					class="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
						{activeTab === tab.id
							? 'text-primary border-b-2 border-primary'
							: 'text-muted-foreground hover:text-white'}"
				>
					<span>{tab.icon}</span>
					{tab.name}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="rounded-xl border border-white/10 bg-card">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
			</div>
		{:else if activeTab === 'haro'}
			<!-- HARO Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">HARO & Press Opportunities</h2>
						<p class="text-sm text-muted-foreground">Respond to journalist queries and get featured in major publications</p>
					</div>
					<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
						Sync HARO Emails
					</button>
				</div>

				{#if haroOpportunities.length === 0}
					<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
						<div class="text-5xl mb-4">📰</div>
						<h3 class="text-lg font-medium text-white mb-2">No HARO opportunities yet</h3>
						<p class="text-muted-foreground mb-6 max-w-md mx-auto">
							Connect your HARO account or forward HARO emails to automatically match queries with your products.
						</p>
						<div class="flex gap-3 justify-center">
							<button class="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition text-sm">
								Setup HARO Integration
							</button>
							<a href="https://www.helpareporter.com" target="_blank" rel="noopener" class="px-4 py-2 text-primary hover:underline text-sm">
								Sign up for HARO
							</a>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#each haroOpportunities as opp}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-xs px-2 py-0.5 rounded-full {getStatusColor(opp.status)}">
												{opp.status.replace('_', ' ')}
											</span>
											<span class="text-xs text-muted-foreground">{opp.query?.publication || 'Unknown'}</span>
										</div>
										<h3 class="font-medium text-white mb-1">{opp.query?.query_title}</h3>
										<p class="text-sm text-muted-foreground line-clamp-2">{opp.query?.query_content}</p>
										{#if opp.query?.deadline}
											<p class="text-xs text-yellow-400 mt-2">Deadline: {formatDate(opp.query.deadline)}</p>
										{/if}
									</div>
									<div class="flex gap-2">
										<button class="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white rounded hover:bg-white/10 transition">
											View Draft
										</button>
										<button class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition">
											Send Pitch
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'newsletters'}
			<!-- Newsletters Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Newsletter Outreach</h2>
						<p class="text-sm text-muted-foreground">Get featured in relevant newsletters with personalized pitches</p>
					</div>
					<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
						Find Newsletters
					</button>
				</div>

				{#if newsletterOutreach.length === 0}
					<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
						<div class="text-5xl mb-4">📧</div>
						<h3 class="text-lg font-medium text-white mb-2">No newsletter campaigns yet</h3>
						<p class="text-muted-foreground mb-6 max-w-md mx-auto">
							We'll find relevant newsletters in your niche and generate personalized pitch emails.
						</p>
						<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
							Start Newsletter Campaign
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each newsletterOutreach as outreach}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-xs px-2 py-0.5 rounded-full {getStatusColor(outreach.status)}">
												{outreach.status}
											</span>
											<span class="text-xs text-muted-foreground">{outreach.subscribers_count?.toLocaleString() || '?'} subscribers</span>
										</div>
										<h3 class="font-medium text-white mb-1">{outreach.newsletter_name}</h3>
										<p class="text-sm text-muted-foreground">{outreach.pitch_subject}</p>
									</div>
									<div class="flex gap-2">
										<button class="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white rounded hover:bg-white/10 transition">
											Edit Pitch
										</button>
										{#if outreach.contact_email}
											<a href="mailto:{outreach.contact_email}?subject={encodeURIComponent(outreach.pitch_subject)}&body={encodeURIComponent(outreach.pitch_draft)}"
												 class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition">
												Send Email
											</a>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'community'}
			<!-- Community Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Community Opportunities</h2>
						<p class="text-sm text-muted-foreground">Reddit, Quora, and Hacker News discussions where you can help</p>
					</div>
					<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
						Scan for Opportunities
					</button>
				</div>

				{#if communityOpportunities.length === 0}
					<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
						<div class="text-5xl mb-4">💬</div>
						<h3 class="text-lg font-medium text-white mb-2">No community opportunities yet</h3>
						<p class="text-muted-foreground mb-6 max-w-md mx-auto">
							We'll monitor Reddit, Quora, and HN for relevant discussions and draft helpful responses.
						</p>
						<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
							Start Monitoring
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each communityOpportunities as opp}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-xs px-2 py-0.5 rounded-full {getStatusColor(opp.status)}">
												{opp.status.replace('_', ' ')}
											</span>
											<span class="text-xs text-muted-foreground capitalize">{opp.platform}</span>
											{#if opp.subreddit}
												<span class="text-xs text-muted-foreground">r/{opp.subreddit}</span>
											{/if}
										</div>
										<h3 class="font-medium text-white mb-1">{opp.question_title}</h3>
										<p class="text-sm text-muted-foreground line-clamp-2">{opp.generated_answer?.substring(0, 150)}...</p>
									</div>
									<div class="flex gap-2">
										<a href={opp.question_url} target="_blank" rel="noopener"
											 class="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white rounded hover:bg-white/10 transition">
											View Post
										</a>
										<button class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition">
											Copy Response
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'reviews'}
			<!-- Reviews Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Review Management</h2>
						<p class="text-sm text-muted-foreground">Collect reviews on G2, Capterra, Trustpilot and more</p>
					</div>
					<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
						Request Reviews
					</button>
				</div>

				<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
					<div class="text-5xl mb-4">⭐</div>
					<h3 class="text-lg font-medium text-white mb-2">No review campaigns yet</h3>
					<p class="text-muted-foreground mb-6 max-w-md mx-auto">
						Set up automated email sequences to collect reviews from your customers.
					</p>
					<div class="flex gap-3 justify-center">
						<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
							Create Review Campaign
						</button>
					</div>

					<!-- Review platforms grid -->
					<div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
						{#each ['G2', 'Capterra', 'Trustpilot', 'Product Hunt'] as platform}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5">
								<div class="text-2xl mb-2">{platform === 'G2' ? '🏆' : platform === 'Capterra' ? '📊' : platform === 'Trustpilot' ? '⭐' : '🚀'}</div>
								<div class="text-sm font-medium text-white">{platform}</div>
								<div class="text-xs text-muted-foreground">0 reviews</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
