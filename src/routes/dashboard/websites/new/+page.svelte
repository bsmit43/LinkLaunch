<script lang="ts">
	import { goto } from '$app/navigation';
	import { createSupabaseBrowserClient } from '$lib/supabase';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';

	const supabase = createSupabaseBrowserClient();

	let step = 1;
	let loading = false;
	let error = '';

	type BusinessType = 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'service' | 'content' | '';

	// Form data
	let formData: {
		name: string;
		url: string;
		tagline: string;
		description_short: string;
		description_medium: string;
		industry: string;
		category: string;
		business_type: BusinessType;
		target_audience: string;
		keywords: string;
		contact_email: string;
		founder_name: string;
		founder_title: string;
		twitter_url: string;
		linkedin_url: string;
		github_url: string;
	} = {
		// Step 1: Basic Info
		name: '',
		url: '',
		tagline: '',
		description_short: '',
		description_medium: '',

		// Step 2: Business Details
		industry: '',
		category: '',
		business_type: '',
		target_audience: '',
		keywords: '',

		// Step 3: Contact & Social
		contact_email: '',
		founder_name: '',
		founder_title: '',
		twitter_url: '',
		linkedin_url: '',
		github_url: ''
	};

	const industries = [
		'SaaS & Software',
		'E-commerce',
		'FinTech',
		'HealthTech',
		'EdTech',
		'MarTech',
		'Developer Tools',
		'AI & Machine Learning',
		'Productivity',
		'Design & Creative',
		'Other'
	];

	const businessTypes = [
		{ value: 'b2b', label: 'B2B (Business to Business)' },
		{ value: 'b2c', label: 'B2C (Business to Consumer)' },
		{ value: 'b2b2c', label: 'B2B2C (Both)' },
		{ value: 'saas', label: 'SaaS' },
		{ value: 'marketplace', label: 'Marketplace' },
		{ value: 'ecommerce', label: 'E-commerce' }
	];

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				error = 'You must be logged in';
				loading = false;
				return;
			}

			const insertData = {
				user_id: user.id,
				name: formData.name,
				url: formData.url,
				tagline: formData.tagline || null,
				description_short: formData.description_short || null,
				description_medium: formData.description_medium || null,
				industry: formData.industry || null,
				category: formData.category || null,
				business_type: formData.business_type || null,
				target_audience: formData.target_audience || null,
				keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : null,
				contact_email: formData.contact_email || null,
				founder_name: formData.founder_name || null,
				founder_title: formData.founder_title || null,
				twitter_url: formData.twitter_url || null,
				linkedin_url: formData.linkedin_url || null,
				github_url: formData.github_url || null,
				onboarding_completed: true
			} as const;

			const { data: website, error: insertError } = await supabase
				.from('websites')
				.insert(insertData as any)
				.select()
				.single();

			if (insertError) throw insertError;
			if (!website) throw new Error('Website not created');

			goto(`/dashboard/websites/${(website as any).id}`);
		} catch (e: any) {
			error = e.message;
			loading = false;
		}
	}

	function nextStep() {
		if (step < 3) step++;
	}

	function prevStep() {
		if (step > 1) step--;
	}
</script>

<svelte:head>
	<title>Add Website - LinkLaunch</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<a href="/dashboard/websites" class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-4">
			← Back to websites
		</a>
		<h1 class="text-3xl font-bold text-white mb-2">Add New Website</h1>
		<p class="text-muted-foreground">
			Tell us about your product so we can submit it to the right directories.
		</p>
	</div>

	<!-- Progress -->
	<div class="mb-8">
		<div class="flex items-center justify-between mb-2">
			{#each [1, 2, 3] as s}
				<div class="flex items-center">
					<div class="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium {step >= s ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'}">
						{s}
					</div>
					{#if s < 3}
						<div class="w-16 sm:w-24 h-1 mx-2 rounded {step > s ? 'bg-primary' : 'bg-white/10'}"></div>
					{/if}
				</div>
			{/each}
		</div>
		<div class="flex justify-between text-xs text-muted-foreground">
			<span>Basic Info</span>
			<span>Business Details</span>
			<span>Contact & Social</span>
		</div>
	</div>

	{#if error}
		<div class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
			{error}
		</div>
	{/if}

	<div class="rounded-xl border border-white/10 bg-card p-8">
		<!-- Step 1: Basic Info -->
		{#if step === 1}
			<div class="space-y-6">
				<div>
					<label for="name" class="block text-sm font-medium text-white mb-2">
						Product Name <span class="text-red-400">*</span>
					</label>
					<input
						type="text"
						id="name"
						bind:value={formData.name}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="My Awesome Product"
						required
					/>
				</div>

				<div>
					<label for="url" class="block text-sm font-medium text-white mb-2">
						Website URL <span class="text-red-400">*</span>
					</label>
					<input
						type="url"
						id="url"
						bind:value={formData.url}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="https://example.com"
						required
					/>
				</div>

				<div>
					<label for="tagline" class="block text-sm font-medium text-white mb-2">
						Tagline
					</label>
					<input
						type="text"
						id="tagline"
						bind:value={formData.tagline}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="A short, catchy description"
						maxlength="100"
					/>
					<p class="mt-1 text-xs text-muted-foreground">{formData.tagline.length}/100 characters</p>
				</div>

				<div>
					<label for="description_short" class="block text-sm font-medium text-white mb-2">
						Short Description <span class="text-red-400">*</span>
					</label>
					<textarea
						id="description_short"
						bind:value={formData.description_short}
						rows="2"
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
						placeholder="Describe your product in 1-2 sentences (for listings)"
						maxlength="160"
					></textarea>
					<p class="mt-1 text-xs text-muted-foreground">{formData.description_short.length}/160 characters</p>
				</div>

				<div>
					<label for="description_medium" class="block text-sm font-medium text-white mb-2">
						Detailed Description
					</label>
					<textarea
						id="description_medium"
						bind:value={formData.description_medium}
						rows="4"
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
						placeholder="A more detailed description of your product, features, and benefits"
						maxlength="500"
					></textarea>
					<p class="mt-1 text-xs text-muted-foreground">{formData.description_medium.length}/500 characters</p>
				</div>
			</div>
		{/if}

		<!-- Step 2: Business Details -->
		{#if step === 2}
			<div class="space-y-6">
				<div>
					<label for="industry" class="block text-sm font-medium text-white mb-2">
						Industry <span class="text-red-400">*</span>
					</label>
					<select
						id="industry"
						bind:value={formData.industry}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
						required
					>
						<option value="" disabled>Select an industry</option>
						{#each industries as industry}
							<option value={industry}>{industry}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="category" class="block text-sm font-medium text-white mb-2">
						Category
					</label>
					<input
						type="text"
						id="category"
						bind:value={formData.category}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="e.g., Project Management, CRM, Analytics"
					/>
				</div>

				<div>
					<label for="business_type" class="block text-sm font-medium text-white mb-2">
						Business Type
					</label>
					<select
						id="business_type"
						bind:value={formData.business_type}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">Select a business type</option>
						{#each businessTypes as type}
							<option value={type.value}>{type.label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="target_audience" class="block text-sm font-medium text-white mb-2">
						Target Audience
					</label>
					<input
						type="text"
						id="target_audience"
						bind:value={formData.target_audience}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="e.g., Startups, Developers, Marketing teams"
					/>
				</div>

				<div>
					<label for="keywords" class="block text-sm font-medium text-white mb-2">
						Keywords (comma separated)
					</label>
					<input
						type="text"
						id="keywords"
						bind:value={formData.keywords}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="e.g., productivity, task management, team collaboration"
					/>
					<p class="mt-1 text-xs text-muted-foreground">These help us match your product to the right directories</p>
				</div>
			</div>
		{/if}

		<!-- Step 3: Contact & Social -->
		{#if step === 3}
			<div class="space-y-6">
				<div>
					<label for="contact_email" class="block text-sm font-medium text-white mb-2">
						Contact Email
					</label>
					<input
						type="email"
						id="contact_email"
						bind:value={formData.contact_email}
						class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						placeholder="hello@example.com"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="founder_name" class="block text-sm font-medium text-white mb-2">
							Founder Name
						</label>
						<input
							type="text"
							id="founder_name"
							bind:value={formData.founder_name}
							class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="John Doe"
						/>
					</div>
					<div>
						<label for="founder_title" class="block text-sm font-medium text-white mb-2">
							Title
						</label>
						<input
							type="text"
							id="founder_title"
							bind:value={formData.founder_title}
							class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="CEO & Founder"
						/>
					</div>
				</div>

				<div class="border-t border-white/10 pt-6">
					<h3 class="text-sm font-medium text-white mb-4">Social Links (optional)</h3>

					<div class="space-y-4">
						<div>
							<label for="twitter_url" class="block text-sm text-muted-foreground mb-2">
								Twitter / X
							</label>
							<input
								type="url"
								id="twitter_url"
								bind:value={formData.twitter_url}
								class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="https://twitter.com/yourproduct"
							/>
						</div>

						<div>
							<label for="linkedin_url" class="block text-sm text-muted-foreground mb-2">
								LinkedIn
							</label>
							<input
								type="url"
								id="linkedin_url"
								bind:value={formData.linkedin_url}
								class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="https://linkedin.com/company/yourproduct"
							/>
						</div>

						<div>
							<label for="github_url" class="block text-sm text-muted-foreground mb-2">
								GitHub
							</label>
							<input
								type="url"
								id="github_url"
								bind:value={formData.github_url}
								class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
								placeholder="https://github.com/yourproduct"
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Navigation -->
		<div class="flex justify-between mt-8 pt-6 border-t border-white/10">
			{#if step > 1}
				<button
					type="button"
					class="px-6 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5 transition"
					on:click={prevStep}
				>
					Back
				</button>
			{:else}
				<div></div>
			{/if}

			{#if step < 3}
				<ShimmerButton on:click={nextStep} disabled={step === 1 && (!formData.name || !formData.url || !formData.description_short)}>
					Continue
				</ShimmerButton>
			{:else}
				<ShimmerButton on:click={handleSubmit} disabled={loading || !formData.industry}>
					{loading ? 'Creating...' : 'Create Website'}
				</ShimmerButton>
			{/if}
		</div>
	</div>
</div>
