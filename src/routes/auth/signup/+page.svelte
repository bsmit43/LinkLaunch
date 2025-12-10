<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import Particles from '$lib/components/ui/Particles.svelte';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';

	const supabase = createSupabaseBrowserClient();

	let fullName = '';
	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let success = false;

	async function handleSignup() {
		loading = true;
		error = '';

		const { error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: fullName
				},
				emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`
			}
		});

		if (authError) {
			error = authError.message;
			loading = false;
			return;
		}

		success = true;
		loading = false;
	}

	async function handleOAuthLogin(provider: 'google' | 'github') {
		loading = true;
		error = '';

		const { error: authError } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`
			}
		});

		if (authError) {
			error = authError.message;
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - LinkLaunch</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
	<Particles className="absolute inset-0" quantity={80} color="#6366F1" />

	<div class="relative w-full max-w-md">
		<!-- Logo -->
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2">
				<span class="text-3xl">🚀</span>
				<span class="text-2xl font-bold text-white">LinkLaunch</span>
			</a>
		</div>

		<!-- Card -->
		<div class="glass-card p-8">
			{#if success}
				<div class="text-center py-8">
					<div class="text-5xl mb-4">📧</div>
					<h1 class="text-2xl font-bold text-white mb-2">Check your email</h1>
					<p class="text-muted-foreground mb-6">
						We've sent you a confirmation link to <span class="text-white">{email}</span>
					</p>
					<a href="/auth/login" class="text-primary hover:underline">
						Back to login
					</a>
				</div>
			{:else}
				<h1 class="text-2xl font-bold text-white text-center mb-2">Create your account</h1>
				<p class="text-muted-foreground text-center mb-8">
					Start launching your links into orbit
				</p>

				{#if error}
					<div class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
						{error}
					</div>
				{/if}

				<!-- OAuth Buttons -->
				<div class="space-y-3 mb-6">
					<button
						type="button"
						class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white font-medium transition hover:bg-white/10 disabled:opacity-50"
						on:click={() => handleOAuthLogin('google')}
						disabled={loading}
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continue with Google
					</button>

					<button
						type="button"
						class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white font-medium transition hover:bg-white/10 disabled:opacity-50"
						on:click={() => handleOAuthLogin('github')}
						disabled={loading}
					>
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
						Continue with GitHub
					</button>
				</div>

				<div class="relative mb-6">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-white/10"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-card text-muted-foreground">or continue with email</span>
					</div>
				</div>

				<!-- Email Form -->
				<form on:submit|preventDefault={handleSignup} class="space-y-4">
					<div>
						<label for="fullName" class="block text-sm font-medium text-muted-foreground mb-2">
							Full Name
						</label>
						<input
							type="text"
							id="fullName"
							bind:value={fullName}
							class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="John Doe"
							required
						/>
					</div>

					<div>
						<label for="email" class="block text-sm font-medium text-muted-foreground mb-2">
							Email
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="you@example.com"
							required
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-muted-foreground mb-2">
							Password
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							placeholder="••••••••"
							minlength="6"
							required
						/>
					</div>

					<ShimmerButton type="submit" className="w-full py-3" disabled={loading}>
						{loading ? 'Creating account...' : 'Create free account'}
					</ShimmerButton>
				</form>

				<p class="mt-6 text-center text-xs text-muted-foreground">
					By signing up, you agree to our
					<a href="/terms" class="text-primary hover:underline">Terms of Service</a>
					and
					<a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>
				</p>

				<p class="mt-4 text-center text-sm text-muted-foreground">
					Already have an account?
					<a href="/auth/login" class="text-primary hover:underline">Sign in</a>
				</p>
			{/if}
		</div>
	</div>
</div>
