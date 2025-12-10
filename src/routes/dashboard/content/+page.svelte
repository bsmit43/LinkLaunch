<script lang="ts">
	import { onMount } from 'svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';

	export let data;

	let activeTab = 'syndication';
	let loading = true;

	// Content data
	let syndications: any[] = [];
	let socialPosts: any[] = [];
	let selectedWebsite = '';

	// Stats
	let stats = {
		syndicated: 0,
		backlinks: 0,
		scheduled: 0,
		posted: 0
	};

	const tabs = [
		{ id: 'syndication', name: 'Content Syndication', icon: '📤', description: 'Auto-publish to Medium, Dev.to, Hashnode' },
		{ id: 'social', name: 'Social Scheduler', icon: '📱', description: 'Schedule posts for Twitter & LinkedIn' },
		{ id: 'generator', name: 'Content Generator', icon: '✨', description: 'AI-generated content variations' }
	];

	const syndicationPlatforms = [
		{ id: 'medium', name: 'Medium', icon: '📝', da: 96, dofollow: false },
		{ id: 'devto', name: 'Dev.to', icon: '👨‍💻', da: 78, dofollow: true },
		{ id: 'hashnode', name: 'Hashnode', icon: '📗', da: 72, dofollow: true },
		{ id: 'linkedin', name: 'LinkedIn', icon: '💼', da: 98, dofollow: false }
	];

	onMount(async () => {
		await loadContent();
		loading = false;
	});

	async function loadContent() {
		// Would fetch from API
		syndications = [];
		socialPosts = [];
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			pending: 'bg-yellow-500/10 text-yellow-400',
			rewriting: 'bg-blue-500/10 text-blue-400',
			scheduled: 'bg-purple-500/10 text-purple-400',
			published: 'bg-green-500/10 text-green-400',
			posted: 'bg-green-500/10 text-green-400',
			failed: 'bg-red-500/10 text-red-400',
			draft: 'bg-gray-500/10 text-gray-400'
		};
		return colors[status] || 'bg-gray-500/10 text-gray-400';
	}
</script>

<svelte:head>
	<title>Content - LinkLaunch</title>
</svelte:head>

<div class="max-w-7xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Content Hub</h1>
		<p class="text-muted-foreground">
			Syndicate content to high-DA platforms and schedule social posts.
		</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">📤</span>
				<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
					Syndicated
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.syndicated} />
			</div>
			<div class="text-sm text-muted-foreground">Articles Published</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">🔗</span>
				<span class="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
					Backlinks
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.backlinks} />
			</div>
			<div class="text-sm text-muted-foreground">From Syndication</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">📅</span>
				<span class="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
					Scheduled
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.scheduled} />
			</div>
			<div class="text-sm text-muted-foreground">Social Posts</div>
		</MagicCard>

		<MagicCard className="p-6" gradientColor="#1a1a2e">
			<div class="flex items-center justify-between mb-4">
				<span class="text-2xl">✅</span>
				<span class="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">
					Posted
				</span>
			</div>
			<div class="text-3xl font-bold text-white mb-1">
				<NumberTicker value={stats.posted} />
			</div>
			<div class="text-sm text-muted-foreground">This Month</div>
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
		{:else if activeTab === 'syndication'}
			<!-- Syndication Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Content Syndication</h2>
						<p class="text-sm text-muted-foreground">Republish your content to high-DA platforms for backlinks and reach</p>
					</div>
					<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
						Syndicate Article
					</button>
				</div>

				<!-- Platform cards -->
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
					{#each syndicationPlatforms as platform}
						<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
							<div class="text-2xl mb-2">{platform.icon}</div>
							<div class="font-medium text-white mb-1">{platform.name}</div>
							<div class="flex items-center gap-2 text-xs">
								<span class="text-muted-foreground">DA {platform.da}</span>
								<span class="{platform.dofollow ? 'text-green-400' : 'text-yellow-400'}">
									{platform.dofollow ? 'dofollow' : 'nofollow'}
								</span>
							</div>
						</div>
					{/each}
				</div>

				{#if syndications.length === 0}
					<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
						<div class="text-5xl mb-4">📤</div>
						<h3 class="text-lg font-medium text-white mb-2">No syndicated content yet</h3>
						<p class="text-muted-foreground mb-6 max-w-md mx-auto">
							Republish your blog posts to Medium, Dev.to, and Hashnode to build high-quality backlinks.
						</p>
						<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
							Syndicate Your First Article
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each syndications as syn}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-xs px-2 py-0.5 rounded-full {getStatusColor(syn.status)}">
												{syn.status}
											</span>
											<span class="text-xs text-muted-foreground capitalize">{syn.platform}</span>
										</div>
										<h3 class="font-medium text-white mb-1">{syn.original_title}</h3>
										<p class="text-sm text-muted-foreground">Original: {syn.original_url}</p>
										{#if syn.published_url}
											<a href={syn.published_url} target="_blank" rel="noopener" class="text-sm text-primary hover:underline">
												View on {syn.platform}
											</a>
										{/if}
									</div>
									<div class="text-xs text-muted-foreground">
										{formatDate(syn.published_at || syn.created_at)}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'social'}
			<!-- Social Scheduler Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Social Scheduler</h2>
						<p class="text-sm text-muted-foreground">Schedule and manage social media posts</p>
					</div>
					<div class="flex gap-2">
						<button class="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition text-sm">
							Generate Week
						</button>
						<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
							Create Post
						</button>
					</div>
				</div>

				{#if socialPosts.length === 0}
					<div class="text-center py-16 border border-dashed border-white/10 rounded-lg">
						<div class="text-5xl mb-4">📱</div>
						<h3 class="text-lg font-medium text-white mb-2">No scheduled posts yet</h3>
						<p class="text-muted-foreground mb-6 max-w-md mx-auto">
							Generate AI-powered social content or create posts manually to maintain consistent presence.
						</p>
						<div class="flex gap-3 justify-center">
							<button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm">
								Generate Week's Content
							</button>
							<button class="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition text-sm">
								Create Thread from Blog
							</button>
						</div>
					</div>
				{:else}
					<!-- Calendar/List view -->
					<div class="space-y-4">
						{#each socialPosts as post}
							<div class="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<span class="text-xs px-2 py-0.5 rounded-full {getStatusColor(post.status)}">
												{post.status}
											</span>
											<span class="text-xs text-muted-foreground capitalize">{post.platform}</span>
											{#if post.content_type}
												<span class="text-xs text-muted-foreground">• {post.content_type}</span>
											{/if}
										</div>
										<p class="text-sm text-white line-clamp-2">{post.content}</p>
									</div>
									<div class="text-right">
										<div class="text-xs text-muted-foreground mb-2">
											{formatDate(post.scheduled_at)}
										</div>
										<div class="flex gap-2">
											<button class="px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white rounded hover:bg-white/10 transition">
												Edit
											</button>
											{#if post.status === 'draft'}
												<button class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary/90 transition">
													Approve
												</button>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if activeTab === 'generator'}
			<!-- Content Generator Tab -->
			<div class="p-6">
				<div class="flex items-center justify-between mb-6">
					<div>
						<h2 class="text-xl font-semibold text-white">Content Generator</h2>
						<p class="text-sm text-muted-foreground">Generate AI-powered content for various platforms</p>
					</div>
				</div>

				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
					<!-- Generator cards -->
					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">🐦</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">Twitter Thread</h3>
						<p class="text-sm text-muted-foreground">Convert a blog post into an engaging thread</p>
					</button>

					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">💼</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">LinkedIn Post</h3>
						<p class="text-sm text-muted-foreground">Professional posts for thought leadership</p>
					</button>

					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">📝</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">Description Variations</h3>
						<p class="text-sm text-muted-foreground">Multiple descriptions for directories</p>
					</button>

					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">📰</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">Press Release</h3>
						<p class="text-sm text-muted-foreground">Announcements for launches and updates</p>
					</button>

					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">📧</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">Pitch Emails</h3>
						<p class="text-sm text-muted-foreground">Outreach templates for newsletters</p>
					</button>

					<button class="p-6 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-left group">
						<div class="text-3xl mb-3">🎙️</div>
						<h3 class="font-medium text-white mb-1 group-hover:text-primary transition">Podcast Pitch</h3>
						<p class="text-sm text-muted-foreground">Guest appearance pitches</p>
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
