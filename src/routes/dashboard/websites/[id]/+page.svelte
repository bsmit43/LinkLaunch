<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';

	export let data;

	const supabase = createSupabaseBrowserClient();
	$: website = data.website;
	$: stats = data.stats ?? { total: 0, approved: 0, pending: 0, in_progress: 0, submitted: 0, failed: 0, backlinks: 0 };
	$: submissions = data.submissions ?? [];

	// Calculate progress
	$: processedCount = stats.submitted + stats.approved + stats.failed;
	$: progress = stats.total > 0 ? Math.round((processedCount / stats.total) * 100) : 0;
	$: hasPendingWork = stats.pending > 0 || stats.in_progress > 0;

	let deleting = false;
	let showDeleteConfirm = false;
	let processing = false;
	let processMessage = '';

	async function deleteWebsite() {
		deleting = true;
		const { error } = await supabase
			.from('websites')
			.delete()
			.eq('id', website.id);

		if (error) {
			console.error('Error deleting website:', error);
			deleting = false;
			return;
		}

		goto('/dashboard/websites');
	}

	async function processSubmissions() {
		if (processing) return;
		processing = true;
		processMessage = '';

		try {
			const response = await fetch('/api/submissions/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();

			if (!response.ok) {
				processMessage = result.message || 'Failed to process submissions';
				return;
			}

			processMessage = result.message || `Processed ${result.processed} submissions`;

			// Refresh the page data
			await invalidateAll();
		} catch (err) {
			processMessage = 'Error connecting to worker';
			console.error('Process error:', err);
		} finally {
			processing = false;
		}
	}

	function getStatusBadge(status: string) {
		const badges: Record<string, string> = {
			pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
			in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
			submitted: 'bg-green-500/10 text-green-400 border-green-500/20',
			approved: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
			failed: 'bg-red-500/10 text-red-400 border-red-500/20',
			rejected: 'bg-red-500/10 text-red-400 border-red-500/20'
		};
		return badges[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
	}
</script>

<svelte:head>
	<title>{website.name} - LinkLaunch</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
	<!-- Back Link -->
	<a href="/dashboard/websites" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6">
		← Back to websites
	</a>

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
		<div class="flex items-start gap-4">
			<div class="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center text-3xl shrink-0">
				{#if website.logo_url}
					<img src={website.logo_url} alt={website.name} class="h-full w-full rounded-xl object-cover" />
				{:else}
					🌐
				{/if}
			</div>
			<div>
				<h1 class="text-3xl font-bold text-white mb-1">{website.name}</h1>
				<a href={website.url} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline text-sm">
					{website.url} ↗
				</a>
				<div class="mt-2">
					<span class="px-2 py-1 text-xs rounded-full {website.status === 'active' ? 'bg-green-500/10 text-green-400' : website.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}">
						{website.status}
					</span>
				</div>
			</div>
		</div>
		<div class="flex gap-3">
			<a href="/dashboard/websites/{website.id}/edit" class="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition text-sm">
				Edit
			</a>
			<ShimmerButton href="/dashboard/websites/{website.id}/submit">
				Start Submissions
			</ShimmerButton>
		</div>
	</div>

	<!-- Campaign Progress (if there are submissions) -->
	{#if stats.total > 0}
		<MagicCard className="p-6 mb-8" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-lg font-semibold text-white">Submission Progress</h2>
					<p class="text-sm text-muted-foreground">
						{processedCount} of {stats.total} submissions processed
					</p>
				</div>
				<div class="flex items-center gap-3">
					{#if hasPendingWork}
						<button
							class="px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition text-sm disabled:opacity-50"
							onclick={processSubmissions}
							disabled={processing}
						>
							{#if processing}
								Processing...
							{:else}
								Process Now
							{/if}
						</button>
					{/if}
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="w-full bg-white/5 rounded-full h-3 mb-4">
				<div
					class="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500"
					style="width: {progress}%"
				></div>
			</div>

			<!-- Status breakdown -->
			<div class="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
				<div class="p-2 rounded bg-yellow-500/10">
					<div class="font-bold text-yellow-400">{stats.pending}</div>
					<div class="text-muted-foreground">Pending</div>
				</div>
				<div class="p-2 rounded bg-blue-500/10">
					<div class="font-bold text-blue-400">{stats.in_progress}</div>
					<div class="text-muted-foreground">In Progress</div>
				</div>
				<div class="p-2 rounded bg-green-500/10">
					<div class="font-bold text-green-400">{stats.submitted}</div>
					<div class="text-muted-foreground">Submitted</div>
				</div>
				<div class="p-2 rounded bg-purple-500/10">
					<div class="font-bold text-purple-400">{stats.approved}</div>
					<div class="text-muted-foreground">Approved</div>
				</div>
				<div class="p-2 rounded bg-red-500/10">
					<div class="font-bold text-red-400">{stats.failed}</div>
					<div class="text-muted-foreground">Failed</div>
				</div>
				<div class="p-2 rounded bg-white/5">
					<div class="font-bold text-white">{stats.backlinks}</div>
					<div class="text-muted-foreground">Live Links</div>
				</div>
			</div>

			{#if processMessage}
				<div class="mt-4 p-3 rounded-lg bg-white/5 text-sm text-muted-foreground">
					{processMessage}
				</div>
			{/if}
		</MagicCard>
	{/if}

	<!-- Stats Cards -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
		<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
			<div class="text-2xl font-bold text-white">{stats.total}</div>
			<div class="text-xs text-muted-foreground">Total Submissions</div>
		</MagicCard>
		<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
			<div class="text-2xl font-bold text-green-400">{stats.approved}</div>
			<div class="text-xs text-muted-foreground">Approved</div>
		</MagicCard>
		<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
			<div class="text-2xl font-bold text-yellow-400">{stats.pending}</div>
			<div class="text-xs text-muted-foreground">Pending</div>
		</MagicCard>
		<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
			<div class="text-2xl font-bold text-blue-400">{stats.backlinks}</div>
			<div class="text-xs text-muted-foreground">Backlinks</div>
		</MagicCard>
	</div>

	<!-- Details -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Description -->
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<h2 class="text-lg font-semibold text-white mb-4">Description</h2>

			{#if website.tagline}
				<p class="text-white font-medium mb-3">{website.tagline}</p>
			{/if}

			{#if website.description_short}
				<p class="text-muted-foreground text-sm mb-4">{website.description_short}</p>
			{/if}

			{#if website.description_medium}
				<p class="text-muted-foreground text-sm">{website.description_medium}</p>
			{/if}

			{#if !website.tagline && !website.description_short && !website.description_medium}
				<p class="text-muted-foreground text-sm italic">No description provided</p>
			{/if}
		</MagicCard>

		<!-- Business Details -->
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<h2 class="text-lg font-semibold text-white mb-4">Business Details</h2>

			<div class="space-y-3 text-sm">
				{#if website.industry}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Industry</span>
						<span class="text-white">{website.industry}</span>
					</div>
				{/if}

				{#if website.category}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Category</span>
						<span class="text-white">{website.category}</span>
					</div>
				{/if}

				{#if website.business_type}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Business Type</span>
						<span class="text-white uppercase">{website.business_type}</span>
					</div>
				{/if}

				{#if website.target_audience}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Target Audience</span>
						<span class="text-white">{website.target_audience}</span>
					</div>
				{/if}
			</div>

			{#if website.keywords && website.keywords.length > 0}
				<div class="mt-4 pt-4 border-t border-white/10">
					<span class="text-muted-foreground text-sm">Keywords</span>
					<div class="flex flex-wrap gap-2 mt-2">
						{#each website.keywords as keyword}
							<span class="px-2 py-1 text-xs rounded-full bg-white/10 text-white">{keyword}</span>
						{/each}
					</div>
				</div>
			{/if}
		</MagicCard>

		<!-- Contact Info -->
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<h2 class="text-lg font-semibold text-white mb-4">Contact Info</h2>

			<div class="space-y-3 text-sm">
				{#if website.founder_name}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Founder</span>
						<span class="text-white">
							{website.founder_name}
							{#if website.founder_title}
								<span class="text-muted-foreground">({website.founder_title})</span>
							{/if}
						</span>
					</div>
				{/if}

				{#if website.contact_email}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Email</span>
						<a href="mailto:{website.contact_email}" class="text-primary hover:underline">{website.contact_email}</a>
					</div>
				{/if}
			</div>

			{#if !website.founder_name && !website.contact_email}
				<p class="text-muted-foreground text-sm italic">No contact info provided</p>
			{/if}
		</MagicCard>

		<!-- Social Links -->
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<h2 class="text-lg font-semibold text-white mb-4">Social Links</h2>

			<div class="space-y-3 text-sm">
				{#if website.twitter_url}
					<a href={website.twitter_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-muted-foreground hover:text-white transition">
						<span>Twitter / X</span>
						<span class="text-primary">↗</span>
					</a>
				{/if}

				{#if website.linkedin_url}
					<a href={website.linkedin_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-muted-foreground hover:text-white transition">
						<span>LinkedIn</span>
						<span class="text-primary">↗</span>
					</a>
				{/if}

				{#if website.github_url}
					<a href={website.github_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-muted-foreground hover:text-white transition">
						<span>GitHub</span>
						<span class="text-primary">↗</span>
					</a>
				{/if}

				{#if website.producthunt_url}
					<a href={website.producthunt_url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-muted-foreground hover:text-white transition">
						<span>Product Hunt</span>
						<span class="text-primary">↗</span>
					</a>
				{/if}
			</div>

			{#if !website.twitter_url && !website.linkedin_url && !website.github_url && !website.producthunt_url}
				<p class="text-muted-foreground text-sm italic">No social links provided</p>
			{/if}
		</MagicCard>
	</div>

	<!-- Submissions Table -->
	{#if submissions.length > 0}
		<div class="mt-8">
			<h2 class="text-lg font-semibold text-white mb-4">Recent Submissions</h2>
			<div class="rounded-xl border border-white/10 bg-card overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-white/5 border-b border-white/10">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Directory</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">DA</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Link</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each submissions.slice(0, 20) as submission}
								<tr class="hover:bg-white/5 transition">
									<td class="px-4 py-3">
										<div class="font-medium text-white">{submission.directory?.name || 'Unknown'}</div>
										{#if submission.directory?.url}
											<a href={submission.directory.url} target="_blank" class="text-xs text-muted-foreground hover:text-primary">
												{submission.directory.url}
											</a>
										{/if}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{submission.directory?.domain_authority || '-'}
									</td>
									<td class="px-4 py-3">
										<span class="px-2 py-1 text-xs font-medium rounded-full border {getStatusBadge(submission.status)}">
											{submission.status}
										</span>
										{#if submission.error_message}
											<div class="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={submission.error_message}>
												{submission.error_message}
											</div>
										{/if}
									</td>
									<td class="px-4 py-3">
										{#if submission.listing_url}
											<a href={submission.listing_url} target="_blank" class="text-primary hover:underline text-xs">
												View Live
											</a>
										{:else}
											<span class="text-muted-foreground text-xs">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if submissions.length > 20}
					<div class="px-4 py-3 bg-white/5 border-t border-white/10 text-center">
						<a href="/dashboard/submissions?website={website.id}" class="text-primary hover:underline text-sm">
							View all {submissions.length} submissions
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Danger Zone -->
	<div class="mt-8 p-6 rounded-xl border border-red-500/20 bg-red-500/5">
		<h2 class="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
		<p class="text-muted-foreground text-sm mb-4">
			Deleting this website will also remove all associated submissions and data. This action cannot be undone.
		</p>

		{#if showDeleteConfirm}
			<div class="flex items-center gap-3">
				<button
					class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm disabled:opacity-50"
					on:click={deleteWebsite}
					disabled={deleting}
				>
					{deleting ? 'Deleting...' : 'Yes, Delete Website'}
				</button>
				<button
					class="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition text-sm"
					on:click={() => showDeleteConfirm = false}
				>
					Cancel
				</button>
			</div>
		{:else}
			<button
				class="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition text-sm"
				on:click={() => showDeleteConfirm = true}
			>
				Delete Website
			</button>
		{/if}
	</div>
</div>
