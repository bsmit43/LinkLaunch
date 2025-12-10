<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import type { PageData, ActionData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: website = data.website as { id: string; name: string; url: string; industry?: string; business_type?: string };
	$: directories = data.directories as any[];
	$: existingSubmissions = data.existingSubmissions as string[];

	let selectedDirectories: Set<string> = new Set();
	let filter: 'all' | 'free' | 'basic' | 'premium' | 'elite' = 'all';
	let submitting = false;

	// Pagination
	let currentPage = 1;
	const itemsPerPage = 20;

	// Filter out already submitted directories
	$: availableDirectories = directories.filter(
		(d) => !existingSubmissions.includes(d.id)
	);

	$: filteredDirectories = availableDirectories.filter((d: any) => {
		if (filter === 'all') return true;
		if (filter === 'free') return d.is_free;
		return d.tier === filter;
	});

	// Pagination computed values
	$: totalPages = Math.ceil(filteredDirectories.length / itemsPerPage);
	$: paginatedDirectories = filteredDirectories.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to page 1 when filter changes
	$: filter, currentPage = 1;

	function toggleDirectory(id: string) {
		if (selectedDirectories.has(id)) {
			selectedDirectories.delete(id);
		} else {
			selectedDirectories.add(id);
		}
		selectedDirectories = selectedDirectories; // Trigger reactivity
	}

	function selectAll() {
		filteredDirectories.forEach((d: any) => selectedDirectories.add(d.id));
		selectedDirectories = selectedDirectories;
	}

	function clearSelection() {
		selectedDirectories.clear();
		selectedDirectories = selectedDirectories;
	}

	const tierColors: Record<string, string> = {
		basic: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
		premium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
		elite: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
	};

	const typeIcons: Record<string, string> = {
		directory: '📁',
		social: '👥',
		content: '📝',
		review: '⭐',
		news: '📰',
		podcast: '🎙️',
		award: '🏆',
		press: '📣'
	};

	// Handle successful submission
	$: if (form?.success) {
		goto(`/dashboard/submissions?website=${website.id}`);
	}
</script>

<svelte:head>
	<title>Submit {website.name} - LinkLaunch</title>
</svelte:head>

<div class="max-w-5xl mx-auto">
	<!-- Back Link -->
	<a href="/dashboard/websites/{website.id}" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6">
		← Back to {website.name}
	</a>

	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Submit to Directories</h1>
		<p class="text-muted-foreground">
			Select directories to submit <span class="text-white font-medium">{website.name}</span> to.
		</p>
	</div>

	{#if form?.error}
		<div class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
			{form.error}
		</div>
	{/if}

	<!-- Filters & Actions -->
	<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
		<div class="flex flex-wrap gap-2">
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium transition {filter === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
				onclick={() => filter = 'all'}
			>
				All ({availableDirectories.length})
			</button>
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium transition {filter === 'free' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
				onclick={() => filter = 'free'}
			>
				Free
			</button>
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium transition {filter === 'basic' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
				onclick={() => filter = 'basic'}
			>
				Basic
			</button>
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium transition {filter === 'premium' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
				onclick={() => filter = 'premium'}
			>
				Premium
			</button>
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium transition {filter === 'elite' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
				onclick={() => filter = 'elite'}
			>
				Elite
			</button>
		</div>

		<div class="flex gap-2">
			<button
				class="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-white transition"
				onclick={selectAll}
			>
				Select All ({filteredDirectories.length})
			</button>
			<button
				class="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-white transition"
				onclick={clearSelection}
			>
				Clear
			</button>
		</div>
	</div>

	<!-- Pagination Controls -->
	{#if totalPages > 1}
		<div class="flex items-center justify-center gap-4 mb-6">
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
				disabled={currentPage === 1}
				onclick={() => currentPage--}
			>
				← Previous
			</button>
			<span class="text-sm text-muted-foreground">
				Page <span class="text-white font-medium">{currentPage}</span> of <span class="text-white font-medium">{totalPages}</span>
				<span class="hidden sm:inline">({filteredDirectories.length} directories)</span>
			</span>
			<button
				class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
				disabled={currentPage === totalPages}
				onclick={() => currentPage++}
			>
				Next →
			</button>
		</div>
	{/if}

	{#if filteredDirectories.length === 0}
		<div class="text-center py-16 rounded-xl border border-white/10 bg-card">
			<div class="text-6xl mb-6">📭</div>
			<h2 class="text-xl font-bold text-white mb-3">No directories available</h2>
			<p class="text-muted-foreground max-w-md mx-auto">
				{#if existingSubmissions.length > 0}
					You've already submitted to all available directories!
				{:else}
					No directories match your current filter.
				{/if}
			</p>
		</div>
	{:else}
		<form method="POST" use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}>
			<!-- Directory Grid -->
			<div class="grid gap-4 md:grid-cols-2 mb-8">
				{#each paginatedDirectories as directory, i (directory.id + '-' + i)}
					<MagicCard
						className="p-0 overflow-hidden cursor-pointer transition {selectedDirectories.has(directory.id) ? 'ring-2 ring-primary' : ''}"
						gradientColor="#1a1a2e"
					>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="block p-5 cursor-pointer" onclick={() => toggleDirectory(directory.id)}>
							<input
								type="checkbox"
								name="directories"
								value={directory.id}
								checked={selectedDirectories.has(directory.id)}
								class="sr-only"
							/>

							<div class="flex items-start gap-4">
								<!-- Checkbox indicator -->
								<div class="mt-1 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition {selectedDirectories.has(directory.id) ? 'bg-primary border-primary' : 'border-white/30'}">
									{#if selectedDirectories.has(directory.id)}
										<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</div>

								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-1">
										<span class="text-lg">{typeIcons[directory.type] || '🌐'}</span>
										<h3 class="font-semibold text-white truncate">{directory.name}</h3>
									</div>

									<p class="text-xs text-muted-foreground mb-3 line-clamp-2">{directory.description}</p>

									<div class="flex flex-wrap items-center gap-2">
										<span class="px-2 py-0.5 text-xs rounded-full border {tierColors[directory.tier]}">
											{directory.tier}
										</span>

										{#if directory.is_free}
											<span class="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
												Free
											</span>
										{:else}
											<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
												Paid
											</span>
										{/if}

										{#if directory.domain_authority}
											<span class="text-xs text-muted-foreground">
												DA: {directory.domain_authority}
											</span>
										{/if}

										{#if directory.approval_rate}
											<span class="text-xs text-muted-foreground">
												{Math.round(directory.approval_rate * 100)}% approval
											</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</MagicCard>
				{/each}
			</div>

			<!-- Bottom Pagination Controls -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-4 mb-6">
					<button
						class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
						disabled={currentPage === 1}
						onclick={() => currentPage--}
						type="button"
					>
						← Previous
					</button>
					<span class="text-sm text-muted-foreground">
						Page <span class="text-white font-medium">{currentPage}</span> of <span class="text-white font-medium">{totalPages}</span>
					</span>
					<button
						class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
						disabled={currentPage === totalPages}
						onclick={() => currentPage++}
						type="button"
					>
						Next →
					</button>
				</div>
			{/if}

			<!-- Submit Bar -->
			<div class="sticky bottom-4 p-4 rounded-xl bg-card/95 backdrop-blur border border-white/10 flex items-center justify-between">
				<div class="text-sm">
					<span class="text-white font-medium">{selectedDirectories.size}</span>
					<span class="text-muted-foreground"> directories selected</span>
				</div>

				<ShimmerButton
					type="submit"
					disabled={selectedDirectories.size === 0 || submitting}
				>
					{#if submitting}
						Creating submissions...
					{:else}
						Submit to {selectedDirectories.size} {selectedDirectories.size === 1 ? 'directory' : 'directories'}
					{/if}
				</ShimmerButton>
			</div>
		</form>
	{/if}
</div>
