<script lang="ts">
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';

	export let data;

	const supabase = createSupabaseBrowserClient();

	let loading = false;
	let success = false;

	// Profile settings
	let fullName = data.user?.user_metadata?.full_name || '';
	let companyName = '';

	// Notification settings
	let emailNotifications = true;
	let weeklyReport = true;

	async function saveProfile() {
		loading = true;

		// Update user metadata
		await supabase.auth.updateUser({
			data: { full_name: fullName }
		});

		success = true;
		loading = false;

		setTimeout(() => success = false, 3000);
	}
</script>

<svelte:head>
	<title>Settings - LinkLaunch</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-white mb-2">Settings</h1>
		<p class="text-muted-foreground">
			Manage your account settings and preferences.
		</p>
	</div>

	{#if success}
		<div class="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
			Settings saved successfully!
		</div>
	{/if}

	<!-- Profile Section -->
	<div class="rounded-xl border border-white/10 bg-card p-6 mb-6">
		<h2 class="text-xl font-semibold text-white mb-6">Profile</h2>

		<div class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-muted-foreground mb-2">
					Email
				</label>
				<input
					type="email"
					id="email"
					value={data.user?.email || ''}
					disabled
					class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-muted-foreground cursor-not-allowed"
				/>
			</div>

			<div>
				<label for="fullName" class="block text-sm font-medium text-white mb-2">
					Full Name
				</label>
				<input
					type="text"
					id="fullName"
					bind:value={fullName}
					class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="John Doe"
				/>
			</div>

			<div>
				<label for="companyName" class="block text-sm font-medium text-white mb-2">
					Company Name
				</label>
				<input
					type="text"
					id="companyName"
					bind:value={companyName}
					class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="Acme Inc."
				/>
			</div>
		</div>

		<div class="mt-6">
			<ShimmerButton on:click={saveProfile} disabled={loading}>
				{loading ? 'Saving...' : 'Save Changes'}
			</ShimmerButton>
		</div>
	</div>

	<!-- Notifications Section -->
	<div class="rounded-xl border border-white/10 bg-card p-6 mb-6">
		<h2 class="text-xl font-semibold text-white mb-6">Notifications</h2>

		<div class="space-y-4">
			<label class="flex items-center justify-between">
				<div>
					<div class="text-white font-medium">Email Notifications</div>
					<div class="text-sm text-muted-foreground">Receive updates about your submissions</div>
				</div>
				<input
					type="checkbox"
					bind:checked={emailNotifications}
					class="h-5 w-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
				/>
			</label>

			<label class="flex items-center justify-between">
				<div>
					<div class="text-white font-medium">Weekly Report</div>
					<div class="text-sm text-muted-foreground">Get a weekly summary of your backlink progress</div>
				</div>
				<input
					type="checkbox"
					bind:checked={weeklyReport}
					class="h-5 w-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
				/>
			</label>
		</div>
	</div>

	<!-- Subscription Section -->
	<div class="rounded-xl border border-white/10 bg-card p-6 mb-6">
		<h2 class="text-xl font-semibold text-white mb-6">Subscription</h2>

		<div class="flex items-center justify-between">
			<div>
				<div class="flex items-center gap-2">
					<span class="text-2xl">🆓</span>
					<span class="text-lg font-semibold text-white">Free Plan</span>
				</div>
				<p class="text-sm text-muted-foreground mt-1">
					5 directory submissions per month
				</p>
			</div>
			<a
				href="/pricing"
				class="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition"
			>
				Upgrade
			</a>
		</div>
	</div>

	<!-- Danger Zone -->
	<div class="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
		<h2 class="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>

		<div class="flex items-center justify-between">
			<div>
				<div class="text-white font-medium">Delete Account</div>
				<div class="text-sm text-muted-foreground">Permanently delete your account and all data</div>
			</div>
			<button
				class="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
			>
				Delete Account
			</button>
		</div>
	</div>
</div>
