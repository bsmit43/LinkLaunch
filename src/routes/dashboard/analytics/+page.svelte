<script lang="ts">
	import { onMount } from 'svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';

	export let data;

	let timeRange = '30d';

	$: stats = data.stats ?? {
		totalBacklinks: 0,
		doFollowBacklinks: 0,
		averageDA: 0,
		submissionsThisMonth: 0,
		approvalRate: 0,
		syndicatedArticles: 0,
		featuresWon: 0,
		socialPosts: 0
	};

	$: backlinksBySource = data.backlinksBySource ?? [];
	$: submissionsByStatus = data.submissionsByStatus ?? [];
	$: recentBacklinks = data.recentBacklinks ?? [];

	function formatDA(da: number) {
		if (da >= 70) return 'text-green-400';
		if (da >= 40) return 'text-yellow-400';
		return 'text-orange-400';
	}
</script>

<svelte:head>
	<title>Analytics - LinkLaunch</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-white mb-2">Analytics</h1>
			<p class="text-muted-foreground">
				Track your backlink growth and campaign performance.
			</p>
		</div>
		<select
			bind:value={timeRange}
			class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
		>
			<option value="7d">Last 7 days</option>
			<option value="30d">Last 30 days</option>
			<option value="90d">Last 90 days</option>
			<option value="all">All time</option>
		</select>
	</div>

	<!-- Key Metrics -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">🔗</span>
				<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
					Total
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.totalBacklinks} />
			</div>
			<div class="text-sm text-muted-foreground">Total Backlinks</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">✅</span>
				<span class="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
					DoFollow
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.doFollowBacklinks} />
			</div>
			<div class="text-sm text-muted-foreground">DoFollow Links</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">📊</span>
				<span class="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
					Quality
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.averageDA} />
			</div>
			<div class="text-sm text-muted-foreground">Average DA</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">🎯</span>
				<span class="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
					Rate
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				{stats.approvalRate}%
			</div>
			<div class="text-sm text-muted-foreground">Approval Rate</div>
		</MagicCard>
	</div>

	<!-- Channel Performance -->
	<div class="grid lg:grid-cols-2 gap-8 mb-8">
		<!-- Backlinks by Source -->
		<div class="rounded-xl border border-white/10 bg-card p-6">
			<h2 class="text-xl font-semibold text-white mb-6">Backlinks by Source</h2>

			{#if backlinksBySource.length === 0}
				<div class="text-center py-12">
					<div class="text-4xl mb-4">📊</div>
					<p class="text-muted-foreground">No backlinks tracked yet</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each backlinksBySource as source}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
									{source.icon || '🔗'}
								</div>
								<div>
									<div class="text-sm font-medium text-white">{source.name}</div>
									<div class="text-xs text-muted-foreground">DA {source.avgDA}</div>
								</div>
							</div>
							<div class="text-right">
								<div class="text-lg font-semibold text-white">{source.count}</div>
								<div class="text-xs text-muted-foreground">{source.dofollow} dofollow</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Submission Funnel -->
		<div class="rounded-xl border border-white/10 bg-card p-6">
			<h2 class="text-xl font-semibold text-white mb-6">Submission Funnel</h2>

			{#if submissionsByStatus.length === 0}
				<div class="text-center py-12">
					<div class="text-4xl mb-4">📈</div>
					<p class="text-muted-foreground">No submissions yet</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each submissionsByStatus as status}
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-white capitalize">{status.name}</span>
								<span class="text-sm text-muted-foreground">{status.count}</span>
							</div>
							<div class="h-2 rounded-full bg-white/10">
								<div
									class="h-full rounded-full transition-all {status.color || 'bg-primary'}"
									style="width: {status.percentage}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Channel Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<div class="rounded-xl border border-white/10 bg-card p-6">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-2xl">📤</span>
				<span class="text-sm text-muted-foreground">Syndication</span>
			</div>
			<div class="text-2xl font-bold text-white">{stats.syndicatedArticles}</div>
			<div class="text-xs text-muted-foreground mt-1">Articles published</div>
		</div>

		<div class="rounded-xl border border-white/10 bg-card p-6">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-2xl">📰</span>
				<span class="text-sm text-muted-foreground">PR & Media</span>
			</div>
			<div class="text-2xl font-bold text-white">{stats.featuresWon}</div>
			<div class="text-xs text-muted-foreground mt-1">Features won</div>
		</div>

		<div class="rounded-xl border border-white/10 bg-card p-6">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-2xl">📱</span>
				<span class="text-sm text-muted-foreground">Social</span>
			</div>
			<div class="text-2xl font-bold text-white">{stats.socialPosts}</div>
			<div class="text-xs text-muted-foreground mt-1">Posts published</div>
		</div>

		<div class="rounded-xl border border-white/10 bg-card p-6">
			<div class="flex items-center gap-3 mb-3">
				<span class="text-2xl">🚀</span>
				<span class="text-sm text-muted-foreground">Directories</span>
			</div>
			<div class="text-2xl font-bold text-white">{stats.submissionsThisMonth}</div>
			<div class="text-xs text-muted-foreground mt-1">This month</div>
		</div>
	</div>

	<!-- Recent Backlinks -->
	<div class="rounded-xl border border-white/10 bg-card p-6">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-white">Recent Backlinks</h2>
			<span class="text-sm text-muted-foreground">{recentBacklinks.length} total</span>
		</div>

		{#if recentBacklinks.length === 0}
			<div class="text-center py-12">
				<div class="text-4xl mb-4">🔗</div>
				<p class="text-muted-foreground mb-4">No backlinks discovered yet</p>
				<p class="text-sm text-muted-foreground">Backlinks will appear here as directories approve your submissions</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="text-left text-sm text-muted-foreground border-b border-white/10">
							<th class="pb-4 font-medium">Source</th>
							<th class="pb-4 font-medium">DA</th>
							<th class="pb-4 font-medium">Type</th>
							<th class="pb-4 font-medium">Target</th>
							<th class="pb-4 font-medium">Date</th>
						</tr>
					</thead>
					<tbody class="text-sm">
						{#each recentBacklinks as backlink}
							<tr class="border-b border-white/5">
								<td class="py-4">
									<a href={backlink.source_url} target="_blank" rel="noopener" class="text-white hover:text-primary">
										{backlink.source_domain}
									</a>
								</td>
								<td class="py-4">
									<span class="{formatDA(backlink.source_domain_authority)} font-medium">
										{backlink.source_domain_authority || '-'}
									</span>
								</td>
								<td class="py-4">
									<span class="px-2 py-1 rounded text-xs {backlink.link_type === 'dofollow' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}">
										{backlink.link_type || 'unknown'}
									</span>
								</td>
								<td class="py-4 text-muted-foreground max-w-xs truncate">
									{backlink.target_url || backlink.context || '-'}
								</td>
								<td class="py-4 text-muted-foreground">
									{new Date(backlink.discovered_at || backlink.created_at).toLocaleDateString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
