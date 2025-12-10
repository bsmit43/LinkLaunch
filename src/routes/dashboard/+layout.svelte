<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase';

	export let data;

	const supabase = createSupabaseBrowserClient();

	const navItems = [
		{ name: 'Dashboard', href: '/dashboard', icon: '📊' },
		{ name: 'Websites', href: '/dashboard/websites', icon: '🌐' },
		{ name: 'Submissions', href: '/dashboard/submissions', icon: '🚀' },
		{ name: 'Settings', href: '/dashboard/settings', icon: '⚙️' }
	];

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/');
	}

	$: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen bg-background">
	<!-- Top Nav -->
	<header class="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
		<div class="flex h-16 items-center justify-between px-4 lg:px-8">
			<div class="flex items-center gap-4">
				<a href="/" class="flex items-center gap-2">
					<span class="text-2xl">🚀</span>
					<span class="text-xl font-bold text-white hidden sm:block">LinkLaunch</span>
				</a>
			</div>

			<div class="flex items-center gap-4">
				<!-- User menu -->
				<div class="relative group">
					<button class="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition">
						<div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
							{data.user?.email?.charAt(0).toUpperCase() || 'U'}
						</div>
						<span class="hidden sm:block">{data.user?.email}</span>
					</button>

					<div class="absolute right-0 mt-2 w-48 py-2 bg-card border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
						<a href="/dashboard/settings" class="block px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5">
							Settings
						</a>
						<button
							on:click={handleLogout}
							class="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-white hover:bg-white/5"
						>
							Sign out
						</button>
					</div>
				</div>
			</div>
		</div>
	</header>

	<div class="flex pt-16">
		<!-- Sidebar -->
		<aside class="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-background/50 backdrop-blur-xl hidden lg:block">
			<nav class="p-4 space-y-1">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition {currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href))
							? 'bg-primary/10 text-primary'
							: 'text-muted-foreground hover:text-white hover:bg-white/5'}"
					>
						<span class="text-lg">{item.icon}</span>
						{item.name}
					</a>
				{/each}
			</nav>

			<!-- Upgrade CTA -->
			<div class="absolute bottom-4 left-4 right-4">
				<div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
					<div class="flex items-center gap-2 mb-2">
						<span>⭐</span>
						<span class="text-sm font-semibold text-white">Upgrade to Pro</span>
					</div>
					<p class="text-xs text-muted-foreground mb-3">
						Get unlimited submissions and premium directories.
					</p>
					<a
						href="/pricing"
						class="block w-full text-center px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition"
					>
						View Plans
					</a>
				</div>
			</div>
		</aside>

		<!-- Mobile bottom nav -->
		<nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/90 backdrop-blur-xl lg:hidden">
			<div class="flex justify-around py-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex flex-col items-center gap-1 px-4 py-2 text-xs {currentPath === item.href || (item.href !== '/dashboard' && currentPath.startsWith(item.href))
							? 'text-primary'
							: 'text-muted-foreground'}"
					>
						<span class="text-xl">{item.icon}</span>
						{item.name}
					</a>
				{/each}
			</div>
		</nav>

		<!-- Main content -->
		<main class="flex-1 lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8">
			<slot />
		</main>
	</div>
</div>
