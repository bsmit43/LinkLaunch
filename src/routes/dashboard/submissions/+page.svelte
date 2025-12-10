<script lang="ts">
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	// Type for submission with joined data
	type SubmissionWithJoins = {
		id: string;
		website_id: string;
		directory_id: string;
		user_id: string;
		status: string;
		created_at: string;
		listing_url: string | null;
		website?: { id: string; name: string; url: string } | null;
		directory?: { id: string; name: string; url: string; type: string; tier: string; domain_authority: number | null } | null;
	};

	$: submissions = (data.submissions || []) as SubmissionWithJoins[];
	$: websiteFilter = data.websiteFilter as { id: string; name: string } | null;

	let statusFilter: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

	$: filteredSubmissions = submissions.filter((s) => {
		if (statusFilter === 'all') return true;
		if (statusFilter === 'pending') return ['pending', 'queued', 'in_progress', 'submitted'].includes(s.status);
		if (statusFilter === 'approved') return s.status === 'approved';
		if (statusFilter === 'rejected') return ['rejected', 'failed'].includes(s.status);
		return true;
	});

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-500/10 text-yellow-400',
		queued: 'bg-blue-500/10 text-blue-400',
		in_progress: 'bg-blue-500/10 text-blue-400',
		submitted: 'bg-purple-500/10 text-purple-400',
		approved: 'bg-green-500/10 text-green-400',
		rejected: 'bg-red-500/10 text-red-400',
		failed: 'bg-red-500/10 text-red-400'
	};

	const statusLabels: Record<string, string> = {
		pending: 'Pending',
		queued: 'Queued',
		in_progress: 'In Progress',
		submitted: 'Submitted',
		approved: 'Approved',
		rejected: 'Rejected',
		failed: 'Failed'
	};
</script>

<svelte:head>
	<title>Submissions - LinkLaunch</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl font-bold text-white mb-2">Submissions</h1>
			<p class="text-muted-foreground">
				{#if websiteFilter}
					Submissions for <a href="/dashboard/websites/{websiteFilter.id}" class="text-primary hover:underline">{websiteFilter.name}</a>
					<a href="/dashboard/submissions" class="ml-2 text-xs text-muted-foreground hover:text-white">(clear filter)</a>
				{:else}
					Track all your directory submissions and their status.
				{/if}
			</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		<button
			class="px-4 py-2 rounded-lg text-sm font-medium transition {statusFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
			on:click={() => statusFilter = 'all'}
		>
			All ({submissions.length})
		</button>
		<button
			class="px-4 py-2 rounded-lg text-sm font-medium transition {statusFilter === 'pending' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
			on:click={() => statusFilter = 'pending'}
		>
			Pending
		</button>
		<button
			class="px-4 py-2 rounded-lg text-sm font-medium transition {statusFilter === 'approved' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
			on:click={() => statusFilter = 'approved'}
		>
			Approved
		</button>
		<button
			class="px-4 py-2 rounded-lg text-sm font-medium transition {statusFilter === 'rejected' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
			on:click={() => statusFilter = 'rejected'}
		>
			Rejected
		</button>
	</div>

	{#if filteredSubmissions.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16 rounded-xl border border-white/10 bg-card">
			<div class="text-6xl mb-6">🚀</div>
			<h2 class="text-2xl font-bold text-white mb-3">
				{#if submissions.length > 0}
					No matching submissions
				{:else}
					No submissions yet
				{/if}
			</h2>
			<p class="text-muted-foreground max-w-md mx-auto mb-8">
				{#if submissions.length > 0}
					No submissions match your current filter.
				{:else if websiteFilter}
					Start submitting {websiteFilter.name} to directories to see them here.
				{:else}
					Once you add a website and start submitting to directories, your submissions will appear here.
				{/if}
			</p>
			{#if websiteFilter}
				<ShimmerButton href="/dashboard/websites/{websiteFilter.id}/submit">
					Submit to Directories
				</ShimmerButton>
			{:else}
				<ShimmerButton href="/dashboard/websites">
					View Your Websites
				</ShimmerButton>
			{/if}
		</div>
	{:else}
		<!-- Submissions Table -->
		<div class="rounded-xl border border-white/10 bg-card overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-white/10">
							<th class="text-left text-sm font-medium text-muted-foreground px-6 py-4">Directory</th>
							<th class="text-left text-sm font-medium text-muted-foreground px-6 py-4">Website</th>
							<th class="text-left text-sm font-medium text-muted-foreground px-6 py-4">Status</th>
							<th class="text-left text-sm font-medium text-muted-foreground px-6 py-4">Date</th>
							<th class="text-left text-sm font-medium text-muted-foreground px-6 py-4"></th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSubmissions as submission}
							<tr class="border-b border-white/5 hover:bg-white/5">
								<td class="px-6 py-4">
									<div class="flex items-center gap-3">
										<div class="h-8 w-8 rounded bg-white/10 flex items-center justify-center text-sm">
											🌐
										</div>
										<span class="text-white font-medium">{submission.directory?.name}</span>
									</div>
								</td>
								<td class="px-6 py-4 text-muted-foreground">
									{submission.website?.name}
								</td>
								<td class="px-6 py-4">
									<span class="px-2 py-1 rounded-full text-xs font-medium {statusColors[submission.status]}">
										{statusLabels[submission.status]}
									</span>
								</td>
								<td class="px-6 py-4 text-muted-foreground text-sm">
									{new Date(submission.created_at).toLocaleDateString()}
								</td>
								<td class="px-6 py-4">
									{#if submission.listing_url}
										<a
											href={submission.listing_url}
											target="_blank"
											rel="noopener"
											class="text-primary hover:underline text-sm"
										>
											View Listing →
										</a>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>
