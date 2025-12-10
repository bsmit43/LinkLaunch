<script lang="ts">
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';

	export let data;

	$: websites = data.websites ?? [];
</script>

<svelte:head>
	<title>My Websites - LinkLaunch</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
		<div>
			<h1 class="text-3xl font-bold text-white mb-2">My Websites</h1>
			<p class="text-muted-foreground">
				Manage your products and start directory submissions.
			</p>
		</div>
		<ShimmerButton href="/dashboard/websites/new">
			<span class="mr-2">+</span> Add Website
		</ShimmerButton>
	</div>

	{#if websites.length === 0}
		<!-- Empty State -->
		<div class="text-center py-16">
			<div class="text-6xl mb-6">🌐</div>
			<h2 class="text-2xl font-bold text-white mb-3">No websites yet</h2>
			<p class="text-muted-foreground max-w-md mx-auto mb-8">
				Add your first website to start submitting it to hundreds of directories and build valuable backlinks.
			</p>
			<ShimmerButton href="/dashboard/websites/new">
				Add Your First Website
			</ShimmerButton>
		</div>
	{:else}
		<!-- Websites Grid -->
		<div class="grid gap-6 md:grid-cols-2">
			{#each websites as website}
				<MagicCard className="p-0 overflow-hidden" gradientColor="#1a1a2e">
					<a href="/dashboard/websites/{website.id}" class="block">
						<!-- Header -->
						<div class="p-6">
							<div class="flex items-start gap-4">
								<div class="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center text-2xl shrink-0">
									{#if website.logo_url}
										<img src={website.logo_url} alt={website.name} class="h-full w-full rounded-lg object-cover" />
									{:else}
										🌐
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="text-lg font-semibold text-white truncate">{website.name}</h3>
									<p class="text-sm text-muted-foreground truncate">{website.url}</p>
								</div>
								<span class="px-2 py-1 text-xs rounded-full {website.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}">
									{website.status}
								</span>
							</div>

							{#if website.tagline}
								<p class="mt-4 text-sm text-muted-foreground line-clamp-2">
									{website.tagline}
								</p>
							{/if}
						</div>

						<!-- Stats -->
						<div class="flex border-t border-white/10">
							<div class="flex-1 p-4 text-center border-r border-white/10">
								<div class="text-lg font-bold text-white">{website.submission_count ?? 0}</div>
								<div class="text-xs text-muted-foreground">Submissions</div>
							</div>
							<div class="flex-1 p-4 text-center border-r border-white/10">
								<div class="text-lg font-bold text-green-400">{website.approved_count ?? 0}</div>
								<div class="text-xs text-muted-foreground">Approved</div>
							</div>
							<div class="flex-1 p-4 text-center">
								<div class="text-lg font-bold text-yellow-400">{website.pending_count ?? 0}</div>
								<div class="text-xs text-muted-foreground">Pending</div>
							</div>
						</div>
					</a>
				</MagicCard>
			{/each}
		</div>
	{/if}
</div>
