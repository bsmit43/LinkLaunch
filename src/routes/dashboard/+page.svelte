<script lang="ts">
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';

	export let data;

	$: serverStats = data.stats ?? { total: 0, approved: 0, pending: 0, backlinks: 0 };
	$: recentActivity = data.recentActivity ?? [];

	// Format stats for display
	$: stats = [
		{ label: 'Total Submissions', value: serverStats.total, icon: '🚀', change: '+0%' },
		{ label: 'Approved', value: serverStats.approved, icon: '✅', change: '+0%' },
		{ label: 'Pending', value: serverStats.pending, icon: '⏳', change: '0' },
		{ label: 'Backlinks Built', value: serverStats.backlinks, icon: '🔗', change: '+0' }
	];
</script>

<svelte:head>
	<title>Dashboard - LinkLaunch</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
		<p class="text-muted-foreground">
			Here's an overview of your link building progress.
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		{#each stats as stat}
			<MagicCard className="p-6" gradientColor="#1a1a2e">
				<div class="flex items-center justify-between mb-4">
					<span class="text-2xl">{stat.icon}</span>
					<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
						{stat.change}
					</span>
				</div>
				<div class="text-3xl font-bold text-white mb-1">
					<NumberTicker value={stat.value} />
				</div>
				<div class="text-sm text-muted-foreground">{stat.label}</div>
			</MagicCard>
		{/each}
	</div>

	<!-- Main Content Grid -->
	<div class="grid lg:grid-cols-3 gap-8">
		<!-- Quick Actions -->
		<div class="lg:col-span-2">
			<div class="rounded-xl border border-white/10 bg-card p-6">
				<h2 class="text-xl font-semibold text-white mb-6">Quick Actions</h2>

				<div class="grid sm:grid-cols-2 gap-4">
					<a
						href="/dashboard/websites/new"
						class="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition group"
					>
						<div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
							➕
						</div>
						<div>
							<div class="font-medium text-white">Add Website</div>
							<div class="text-sm text-muted-foreground">Start submitting a new product</div>
						</div>
					</a>

					<a
						href="/dashboard/submissions"
						class="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition group"
					>
						<div class="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
							🚀
						</div>
						<div>
							<div class="font-medium text-white">View Submissions</div>
							<div class="text-sm text-muted-foreground">Track your submission progress</div>
						</div>
					</a>

					<a
						href="/dashboard/websites"
						class="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition group"
					>
						<div class="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
							🌐
						</div>
						<div>
							<div class="font-medium text-white">Manage Websites</div>
							<div class="text-sm text-muted-foreground">Edit your product listings</div>
						</div>
					</a>

					<a
						href="/pricing"
						class="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition group"
					>
						<div class="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition">
							⭐
						</div>
						<div>
							<div class="font-medium text-white">Upgrade Plan</div>
							<div class="text-sm text-muted-foreground">Get more submissions</div>
						</div>
					</a>
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="rounded-xl border border-white/10 bg-card p-6 mt-6">
				<h2 class="text-xl font-semibold text-white mb-6">Recent Activity</h2>

				{#if recentActivity.length === 0}
					<div class="text-center py-12">
						<div class="text-5xl mb-4">📭</div>
						<h3 class="text-lg font-medium text-white mb-2">No activity yet</h3>
						<p class="text-muted-foreground mb-6">
							Add your first website to start building backlinks.
						</p>
						<ShimmerButton href="/dashboard/websites/new">
							Add Your First Website
						</ShimmerButton>
					</div>
				{:else}
					<div class="space-y-4">
						{#each recentActivity as activity}
							<div class="flex items-center gap-4 p-4 rounded-lg bg-white/5">
								<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
									{activity.status === 'approved' ? '✅' : ['pending', 'queued', 'in_progress', 'submitted'].includes(activity.status) ? '⏳' : '❌'}
								</div>
								<div class="flex-1">
									<div class="text-sm text-white">{activity.action}</div>
									<div class="text-xs text-muted-foreground">{activity.website}</div>
								</div>
								<div class="text-xs text-muted-foreground">{activity.time}</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Plan Status -->
			<div class="rounded-xl border border-white/10 bg-card p-6">
				<h2 class="text-lg font-semibold text-white mb-4">Your Plan</h2>

				<div class="flex items-center gap-3 mb-4">
					<div class="text-3xl">🆓</div>
					<div>
						<div class="font-medium text-white">Free Plan</div>
						<div class="text-sm text-muted-foreground">5 submissions/month</div>
					</div>
				</div>

				<div class="mb-4">
					<div class="flex justify-between text-sm mb-2">
						<span class="text-muted-foreground">Submissions used</span>
						<span class="text-white">0 / 5</span>
					</div>
					<div class="h-2 rounded-full bg-white/10">
						<div class="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style="width: 0%"></div>
					</div>
				</div>

				<a
					href="/pricing"
					class="block w-full text-center px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition"
				>
					Upgrade Now
				</a>
			</div>

			<!-- Tips -->
			<div class="rounded-xl border border-white/10 bg-card p-6">
				<h2 class="text-lg font-semibold text-white mb-4">💡 Pro Tip</h2>
				<p class="text-sm text-muted-foreground mb-4">
					Add a detailed description and high-quality logo to your website profile to increase your approval rate on directories.
				</p>
				<a href="#" class="text-sm text-primary hover:underline">
					Learn more →
				</a>
			</div>

			<!-- Need Help? -->
			<div class="rounded-xl border border-white/10 bg-card p-6">
				<h2 class="text-lg font-semibold text-white mb-4">Need Help?</h2>
				<div class="space-y-3">
					<a href="#" class="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition">
						<span>📚</span> Documentation
					</a>
					<a href="#" class="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition">
						<span>💬</span> Contact Support
					</a>
					<a href="#" class="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition">
						<span>🐦</span> Follow us on Twitter
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
