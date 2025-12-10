<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { onDestroy } from 'svelte';
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import PulsatingButton from '$lib/components/ui/PulsatingButton.svelte';
	import BorderBeam from '$lib/components/ui/BorderBeam.svelte';
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';
	import WordRotate from '$lib/components/ui/WordRotate.svelte';
	import AnimatedListItem from '$lib/components/ui/AnimatedListItem.svelte';
	import Confetti from '$lib/components/ui/Confetti.svelte';

	export let data;
	export let form;

	const supabase = createSupabaseBrowserClient();
	$: website = data.website;
	$: stats = data.stats ?? { total: 0, approved: 0, pending: 0, in_progress: 0, submitted: 0, failed: 0, backlinks: 0 };
	$: submissions = data.submissions ?? [];
	$: directories = data.directories ?? [];
	$: submittedDirectoryIds = data.submittedDirectoryIds ?? [];

	// Tab state
	let activeTab: 'overview' | 'submit' | 'submissions' = 'overview';

	// Calculate progress
	$: processedCount = stats.submitted + stats.approved + stats.failed;
	$: progress = stats.total > 0 ? Math.round((processedCount / stats.total) * 100) : 0;
	$: hasPendingWork = stats.pending > 0 || stats.in_progress > 0;
	$: successRate = stats.total > 0 ? Math.round(((stats.submitted + stats.approved) / stats.total) * 100) : 0;

	let deleting = false;
	let showDeleteConfirm = false;
	let processing = false;
	let processMessage = '';

	// Enhanced processing state
	let processingPhase: 'idle' | 'starting' | 'processing' | 'complete' | 'error' = 'idle';
	let processStartTime: number | null = null;
	let elapsedSeconds = 0;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Results tracking
	interface ProcessResult {
		id: string;
		directory: string;
		success: boolean;
		error?: string;
		willRetry?: boolean;
	}
	let lastProcessResults: ProcessResult[] = [];
	let showConfetti = false;

	// Directory selection state (for Submit tab)
	let selectedDirectories: Set<string> = new Set();
	let filter: 'all' | 'free' | 'basic' | 'premium' | 'elite' = 'all';
	let submitting = false;
	let currentPage = 1;
	const itemsPerPage = 20;

	// Submissions tab state
	let submissionsFilter: 'all' | 'pending' | 'submitted' | 'failed' = 'all';
	let submissionsPage = 1;
	const submissionsPerPage = 20;
	let expandedSubmissionId: string | null = null;

	// Filter out directories that already have any submission
	// Use "Retry Failed" button to reprocess failed submissions
	$: availableDirectories = directories.filter(
		(d: any) => !submittedDirectoryIds.includes(d.id)
	);

	$: filteredDirectories = availableDirectories.filter((d: any) => {
		if (filter === 'all') return true;
		if (filter === 'free') return d.is_free;
		return d.tier === filter;
	});

	$: totalPages = Math.ceil(filteredDirectories.length / itemsPerPage);
	$: paginatedDirectories = filteredDirectories.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset to page 1 when filter changes
	$: filter, currentPage = 1;

	// Filtered submissions for Submissions tab
	$: filteredSubmissions = submissions.filter((s: any) => {
		if (submissionsFilter === 'all') return true;
		if (submissionsFilter === 'pending') return s.status === 'pending' || s.status === 'in_progress';
		if (submissionsFilter === 'submitted') return s.status === 'submitted' || s.status === 'approved';
		if (submissionsFilter === 'failed') return s.status === 'failed';
		return true;
	});

	$: submissionsTotalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage);
	$: paginatedSubmissions = filteredSubmissions.slice(
		(submissionsPage - 1) * submissionsPerPage,
		submissionsPage * submissionsPerPage
	);

	// Reset submissions page when filter changes
	$: submissionsFilter, submissionsPage = 1;

	// Cleanup intervals on destroy
	onDestroy(() => {
		stopTimers();
	});

	function stopTimers() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	function startPolling() {
		if (pollInterval) return;

		pollInterval = setInterval(async () => {
			try {
				const response = await fetch(`/api/submissions/status?websiteId=${website.id}`);
				if (response.ok) {
					const data = await response.json();
					if (data.stats) {
						stats = { ...stats, ...data.stats };
					}
				}
			} catch (err) {
				console.error('Polling error:', err);
			}
		}, 2500);
	}

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
		processingPhase = 'starting';
		processMessage = '';
		processStartTime = Date.now();
		elapsedSeconds = 0;
		lastProcessResults = [];

		timerInterval = setInterval(() => {
			if (processStartTime) {
				elapsedSeconds = Math.floor((Date.now() - processStartTime) / 1000);
			}
		}, 1000);

		startPolling();

		try {
			processingPhase = 'processing';

			const response = await fetch('/api/submissions/process', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();

			if (!response.ok) {
				processingPhase = 'error';
				processMessage = result.message || 'Failed to process submissions';
				return;
			}

			if (result.results && Array.isArray(result.results)) {
				lastProcessResults = result.results.map((r: any) => ({
					id: r.id,
					directory: r.directory || 'Unknown Directory',
					success: r.success,
					error: r.error,
					willRetry: r.willRetry
				}));
			}

			processingPhase = 'complete';
			processMessage = result.message || `Processed ${result.processed} submissions`;

			const successCount = lastProcessResults.filter(r => r.success).length;
			if (successCount > 0) {
				showConfetti = true;
				setTimeout(() => showConfetti = false, 3000);
			}

			await invalidateAll();
		} catch (err) {
			processingPhase = 'error';
			processMessage = 'Error connecting to worker';
			console.error('Process error:', err);
		} finally {
			processing = false;
			stopTimers();

			setTimeout(() => {
				if (processingPhase === 'complete' || processingPhase === 'error') {
					processingPhase = 'idle';
					lastProcessResults = [];
				}
			}, 30000);
		}
	}

	function dismissResults() {
		processingPhase = 'idle';
		lastProcessResults = [];
		processMessage = '';
	}

	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		return `${diffDays}d ago`;
	}

	function formatDateTime(dateString: string | null): string {
		if (!dateString) return 'Not yet';
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function toggleSubmissionDetails(submissionId: string) {
		expandedSubmissionId = expandedSubmissionId === submissionId ? null : submissionId;
	}

	function getRecentSubmissions(limit: number) {
		return submissions
			.filter((s: any) => s.updated_at)
			.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
			.slice(0, limit);
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

	// Directory selection functions
	function toggleDirectory(id: string) {
		if (selectedDirectories.has(id)) {
			selectedDirectories.delete(id);
		} else {
			selectedDirectories.add(id);
		}
		selectedDirectories = selectedDirectories;
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

	// Handle successful directory submission
	$: if (form?.success) {
		// Clear selection and switch to submissions tab
		selectedDirectories.clear();
		selectedDirectories = selectedDirectories;
		activeTab = 'submissions';
		invalidateAll();
	}
</script>

<svelte:head>
	<title>{website.name} - LinkLaunch</title>
</svelte:head>

<!-- Confetti celebration -->
<Confetti trigger={showConfetti} particleCount={100} spread={80} />

<div class="max-w-5xl mx-auto">
	<!-- Back Link -->
	<a href="/dashboard/websites" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6">
		← Back to websites
	</a>

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
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
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="flex border-b border-white/10 mb-6">
		<button
			class="px-6 py-3 text-sm font-medium transition-colors relative {activeTab === 'overview' ? 'text-white' : 'text-muted-foreground hover:text-white'}"
			onclick={() => activeTab = 'overview'}
		>
			Overview
			{#if activeTab === 'overview'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
			{/if}
		</button>
		<button
			class="px-6 py-3 text-sm font-medium transition-colors relative {activeTab === 'submit' ? 'text-white' : 'text-muted-foreground hover:text-white'}"
			onclick={() => activeTab = 'submit'}
		>
			Submit
			{#if availableDirectories.length > 0}
				<span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">{availableDirectories.length}</span>
			{/if}
			{#if activeTab === 'submit'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
			{/if}
		</button>
		<button
			class="px-6 py-3 text-sm font-medium transition-colors relative {activeTab === 'submissions' ? 'text-white' : 'text-muted-foreground hover:text-white'}"
			onclick={() => activeTab = 'submissions'}
		>
			Submissions
			{#if stats.total > 0}
				<span class="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/10 text-muted-foreground">{stats.total}</span>
			{/if}
			{#if activeTab === 'submissions'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
			{/if}
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'overview'}
		<!-- OVERVIEW TAB -->

		<!-- Campaign Progress (if there are submissions) -->
		{#if stats.total > 0}
			<MagicCard className="p-6 mb-6 relative overflow-hidden" gradientColor="#1a1a2e">
				{#if processingPhase === 'processing'}
					<BorderBeam size={300} duration={8} colorFrom="#6366F1" colorTo="#EC4899" />
				{/if}

				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-lg font-semibold text-white flex items-center gap-2">
							{#if processingPhase === 'processing'}
								<span class="relative flex h-3 w-3">
									<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
								</span>
							{/if}
							Submission Progress
						</h2>
						<p class="text-sm text-muted-foreground">
							{processedCount} of {stats.total} submissions processed
						</p>
					</div>
					<div class="flex items-center gap-3">
						{#if hasPendingWork}
							{#if processingPhase === 'idle' || processingPhase === 'complete' || processingPhase === 'error'}
								<PulsatingButton
									className="text-sm px-4 py-2"
									pulseColor="#6366F1"
									disabled={processing}
									on:click={processSubmissions}
								>
									Process Now ({stats.pending + stats.in_progress})
								</PulsatingButton>
							{:else if processingPhase === 'processing' || processingPhase === 'starting'}
								<div class="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3">
									<div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
									<span class="text-primary text-sm">
										Processing... {elapsedSeconds}s
									</span>
								</div>
							{/if}
						{/if}
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
					<div
						class="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
						class:animate-pulse={processingPhase === 'processing'}
						style="width: {progress}%"
					></div>
				</div>

				{#if processingPhase === 'processing'}
					<div class="flex items-center justify-center mb-4 text-sm text-muted-foreground">
						<WordRotate words={['Connecting to directories...', 'Submitting your website...', 'Filling out forms...', 'Almost done...']} duration={3000} />
					</div>
				{/if}

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

				{#if processMessage && processingPhase !== 'processing'}
					<div class="mt-4 p-3 rounded-lg bg-white/5 text-sm text-muted-foreground">
						{processMessage}
					</div>
				{/if}
			</MagicCard>
		{/if}

		<!-- Processing Results Panel -->
		{#if lastProcessResults.length > 0 && (processingPhase === 'complete' || processingPhase === 'error')}
			<MagicCard className="p-6 mb-6" gradientColor="#1a1a2e">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-white">Processing Results</h3>
					<button
						onclick={dismissResults}
						class="text-xs text-muted-foreground hover:text-white transition"
					>
						Dismiss
					</button>
				</div>

				<div class="grid grid-cols-3 gap-4 mb-4">
					<div class="text-center p-3 rounded-lg bg-green-500/10">
						<div class="text-2xl font-bold text-green-400">
							<NumberTicker value={lastProcessResults.filter(r => r.success).length} />
						</div>
						<div class="text-xs text-muted-foreground">Succeeded</div>
					</div>
					<div class="text-center p-3 rounded-lg bg-red-500/10">
						<div class="text-2xl font-bold text-red-400">
							<NumberTicker value={lastProcessResults.filter(r => !r.success && !r.willRetry).length} />
						</div>
						<div class="text-xs text-muted-foreground">Failed</div>
					</div>
					<div class="text-center p-3 rounded-lg bg-yellow-500/10">
						<div class="text-2xl font-bold text-yellow-400">
							<NumberTicker value={lastProcessResults.filter(r => r.willRetry).length} />
						</div>
						<div class="text-xs text-muted-foreground">Will Retry</div>
					</div>
				</div>

				<div class="space-y-2 max-h-[250px] overflow-y-auto">
					{#each lastProcessResults as result, i}
						<AnimatedListItem index={i} delay={100}>
							<div class="flex items-center justify-between p-2 rounded bg-white/5 text-sm">
								<div class="flex items-center gap-2">
									<span class={result.success ? 'text-green-400' : 'text-red-400'}>
										{result.success ? '✓' : '✗'}
									</span>
									<span class="text-white">{result.directory}</span>
								</div>
								{#if result.error}
									<span class="text-xs text-red-400 truncate max-w-[200px]" title={result.error}>
										{result.error}
									</span>
								{:else if result.willRetry}
									<span class="text-xs text-yellow-400">Will retry</span>
								{/if}
							</div>
						</AnimatedListItem>
					{/each}
				</div>
			</MagicCard>
		{/if}

		<!-- Quick Actions -->
		<div class="grid grid-cols-2 gap-4 mb-6">
			<button
				class="p-4 rounded-xl border border-white/10 bg-card hover:bg-white/5 transition text-left"
				onclick={() => activeTab = 'submit'}
			>
				<div class="text-2xl mb-2">🚀</div>
				<div class="font-medium text-white">Submit to Directories</div>
				<div class="text-xs text-muted-foreground">{availableDirectories.length} directories available</div>
			</button>
			<button
				class="p-4 rounded-xl border border-white/10 bg-card hover:bg-white/5 transition text-left"
				onclick={() => activeTab = 'submissions'}
			>
				<div class="text-2xl mb-2">📊</div>
				<div class="font-medium text-white">View Submissions</div>
				<div class="text-xs text-muted-foreground">{stats.total} total submissions</div>
			</button>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
			<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
				<div class="text-2xl font-bold text-white">{stats.total}</div>
				<div class="text-xs text-muted-foreground">Total</div>
			</MagicCard>
			<MagicCard className="p-4 text-center" gradientColor="#1a1a2e">
				<div class="text-2xl font-bold text-green-400">{stats.submitted + stats.approved}</div>
				<div class="text-xs text-muted-foreground">Submitted</div>
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
						onclick={deleteWebsite}
						disabled={deleting}
					>
						{deleting ? 'Deleting...' : 'Yes, Delete Website'}
					</button>
					<button
						class="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition text-sm"
						onclick={() => showDeleteConfirm = false}
					>
						Cancel
					</button>
				</div>
			{:else}
				<button
					class="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition text-sm"
					onclick={() => showDeleteConfirm = true}
				>
					Delete Website
				</button>
			{/if}
		</div>

	{:else if activeTab === 'submit'}
		<!-- SUBMIT TAB -->

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
					{#if submittedDirectoryIds.length > 0}
						You've already submitted to all available directories!
					{:else}
						No directories match your current filter.
					{/if}
				</p>
			</div>
		{:else}
			<form method="POST" action="?/submitDirectories" use:enhance={() => {
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
									<div class="mt-1 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition {selectedDirectories.has(directory.id) ? 'bg-primary border-primary' : 'border-white/30'}">
										{#if selectedDirectories.has(directory.id)}
											<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
											</svg>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-3 mb-1">
											<div class="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
												{#if directory.logo_url}
													<img
														src={directory.logo_url}
														alt={directory.name}
														class="h-full w-full object-cover"
														onerror={(e) => {
															e.currentTarget.style.display = 'none';
															if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex';
														}}
													/>
													<span class="hidden items-center justify-center h-full w-full text-sm">{typeIcons[directory.type] || '🌐'}</span>
												{:else}
													<img
														src="https://www.google.com/s2/favicons?domain={new URL(directory.url).hostname}&sz=64"
														alt={directory.name}
														class="h-6 w-6"
														onerror={(e) => {
															e.currentTarget.style.display = 'none';
															if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'block';
														}}
													/>
													<span class="hidden text-base">{typeIcons[directory.type] || '🌐'}</span>
												{/if}
											</div>
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

				<!-- Bottom Pagination -->
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

	{:else if activeTab === 'submissions'}
		<!-- SUBMISSIONS TAB -->

		<!-- Filters & Actions -->
		<div class="flex flex-wrap items-center justify-between gap-4 mb-6">
			<div class="flex flex-wrap gap-2">
				<button
					class="px-4 py-2 rounded-lg text-sm font-medium transition {submissionsFilter === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
					onclick={() => submissionsFilter = 'all'}
				>
					All ({stats.total})
				</button>
				<button
					class="px-4 py-2 rounded-lg text-sm font-medium transition {submissionsFilter === 'pending' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
					onclick={() => submissionsFilter = 'pending'}
				>
					Pending ({stats.pending + stats.in_progress})
				</button>
				<button
					class="px-4 py-2 rounded-lg text-sm font-medium transition {submissionsFilter === 'submitted' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
					onclick={() => submissionsFilter = 'submitted'}
				>
					Submitted ({stats.submitted + stats.approved})
				</button>
				<button
					class="px-4 py-2 rounded-lg text-sm font-medium transition {submissionsFilter === 'failed' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-white/10'}"
					onclick={() => submissionsFilter = 'failed'}
				>
					Failed ({stats.failed})
				</button>
			</div>

			<div class="flex items-center gap-2">
				<!-- Processing Active Indicator -->
				{#if stats.in_progress > 0}
					<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
						<div class="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
						<span class="text-xs text-blue-400">Processing {stats.in_progress} submission{stats.in_progress > 1 ? 's' : ''}...</span>
					</div>
				{/if}

				{#if hasPendingWork}
					<PulsatingButton
						className="text-sm px-4 py-2"
						pulseColor="#6366F1"
						disabled={processing}
						on:click={processSubmissions}
					>
						Process ({stats.pending + stats.in_progress})
					</PulsatingButton>
				{/if}
				{#if stats.failed > 0}
					<form method="POST" action="?/retryFailed" use:enhance>
						<button
							type="submit"
							class="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
						>
							Retry Failed ({stats.failed})
						</button>
					</form>
				{/if}
			</div>
		</div>

		<!-- Info Notice -->
		<div class="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
			<svg class="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div class="text-xs text-blue-300/80">
				<span class="font-medium">How submissions work:</span> Your exact website details (name, description) are submitted using pattern-matching to fill forms automatically. No AI is used. Click any row to see what will be submitted. Processing batches 5 submissions at a time with delays between each.
			</div>
		</div>

		{#if filteredSubmissions.length === 0}
			<div class="text-center py-16 rounded-xl border border-white/10 bg-card">
				<div class="text-6xl mb-6">📭</div>
				<h2 class="text-xl font-bold text-white mb-3">No submissions yet</h2>
				<p class="text-muted-foreground max-w-md mx-auto mb-6">
					Start submitting your website to directories to build backlinks.
				</p>
				<ShimmerButton onclick={() => activeTab = 'submit'}>
					Submit to Directories
				</ShimmerButton>
			</div>
		{:else}
			<!-- Submissions Table -->
			<div class="rounded-xl border border-white/10 bg-card overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-white/5 border-b border-white/10">
							<tr>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Directory</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">DA</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Link</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Updated</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/5">
							{#each paginatedSubmissions as submission}
								<!-- Main Row - Clickable to expand -->
								<tr
									class="hover:bg-white/5 transition cursor-pointer {expandedSubmissionId === submission.id ? 'bg-white/5' : ''}"
									onclick={() => toggleSubmissionDetails(submission.id)}
								>
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<span class="text-muted-foreground text-xs transition-transform {expandedSubmissionId === submission.id ? 'rotate-90' : ''}">
												▶
											</span>
											<div class="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
												{#if submission.directory?.url}
													<img
														src="https://www.google.com/s2/favicons?domain={new URL(submission.directory.url).hostname}&sz=64"
														alt={submission.directory?.name}
														class="h-5 w-5"
														onerror={(e) => {
															e.currentTarget.style.display = 'none';
															if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'block';
														}}
													/>
													<span class="hidden text-sm">🌐</span>
												{:else}
													<span class="text-sm">🌐</span>
												{/if}
											</div>
											<div>
												<div class="font-medium text-white">{submission.directory?.name || 'Unknown'}</div>
												{#if submission.directory?.url}
													<a href={submission.directory.url} target="_blank" onclick={(e) => e.stopPropagation()} class="text-xs text-muted-foreground hover:text-primary">
														{new URL(submission.directory.url).hostname}
													</a>
												{/if}
											</div>
										</div>
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
											<a href={submission.listing_url} target="_blank" onclick={(e) => e.stopPropagation()} class="text-primary hover:underline text-xs">
												View Live
											</a>
										{:else}
											<span class="text-muted-foreground text-xs">-</span>
										{/if}
									</td>
									<td class="px-4 py-3 text-xs text-muted-foreground">
										{formatRelativeTime(submission.updated_at || submission.created_at)}
									</td>
									<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
										{#if submission.status === 'pending'}
											<form method="POST" action="?/cancelPending" use:enhance>
												<input type="hidden" name="submissionId" value={submission.id} />
												<button
													type="submit"
													class="text-xs text-red-400 hover:text-red-300 transition"
												>
													Cancel
												</button>
											</form>
										{:else}
											<span class="text-muted-foreground text-xs">-</span>
										{/if}
									</td>
								</tr>

								<!-- Expanded Details Row -->
								{#if expandedSubmissionId === submission.id}
									<tr class="bg-white/[0.02]">
										<td colspan="6" class="px-4 py-4">
											<div class="ml-8 space-y-4">
												<!-- What will be submitted -->
												<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
													<div>
														<div class="text-xs font-medium text-muted-foreground uppercase mb-1">Title to Submit</div>
														<div class="text-sm text-white bg-white/5 rounded px-3 py-2">
															{submission.title_used || website?.name || 'Not set'}
														</div>
													</div>
													<div>
														<div class="text-xs font-medium text-muted-foreground uppercase mb-1">Created</div>
														<div class="text-sm text-white">
															{formatDateTime(submission.created_at)}
														</div>
													</div>
												</div>

												<div>
													<div class="text-xs font-medium text-muted-foreground uppercase mb-1">Description to Submit</div>
													<div class="text-sm text-white bg-white/5 rounded px-3 py-2 max-h-24 overflow-y-auto">
														{submission.description_used || website?.description_medium || website?.description_short || website?.tagline || 'Not set'}
													</div>
												</div>

												<!-- Retry & Timing Info -->
												<div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/10">
													<div>
														<div class="text-xs text-muted-foreground">Retry Count</div>
														<div class="text-sm text-white">{submission.retry_count || 0} of 3</div>
													</div>
													<div>
														<div class="text-xs text-muted-foreground">Next Retry</div>
														<div class="text-sm text-white">
															{#if submission.next_retry_at}
																{formatRelativeTime(submission.next_retry_at)}
															{:else}
																Not scheduled
															{/if}
														</div>
													</div>
													<div>
														<div class="text-xs text-muted-foreground">Submitted At</div>
														<div class="text-sm text-white">{formatDateTime(submission.submitted_at)}</div>
													</div>
													<div>
														<div class="text-xs text-muted-foreground">Last Updated</div>
														<div class="text-sm text-white">{formatDateTime(submission.updated_at)}</div>
													</div>
												</div>

												<!-- Directory link -->
												{#if submission.directory?.url}
													<div class="pt-2">
														<a
															href={submission.directory.url}
															target="_blank"
															class="inline-flex items-center gap-2 text-xs text-primary hover:underline"
														>
															View Directory Submission Page
															<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
															</svg>
														</a>
													</div>
												{/if}
											</div>
										</td>
									</tr>
								{/if}
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Pagination -->
				{#if submissionsTotalPages > 1}
					<div class="px-4 py-3 bg-white/5 border-t border-white/10 flex items-center justify-center gap-4">
						<button
							class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {submissionsPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
							disabled={submissionsPage === 1}
							onclick={() => submissionsPage--}
						>
							← Previous
						</button>
						<span class="text-sm text-muted-foreground">
							Page <span class="text-white font-medium">{submissionsPage}</span> of <span class="text-white font-medium">{submissionsTotalPages}</span>
						</span>
						<button
							class="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 transition {submissionsPage === submissionsTotalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 text-white'}"
							disabled={submissionsPage === submissionsTotalPages}
							onclick={() => submissionsPage++}
						>
							Next →
						</button>
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>
