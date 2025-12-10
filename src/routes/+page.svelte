<script lang="ts">
	import { onMount } from 'svelte';
	import Particles from '$lib/components/ui/Particles.svelte';
	import ShimmerButton from '$lib/components/ui/ShimmerButton.svelte';
	import WordRotate from '$lib/components/ui/WordRotate.svelte';
	import NumberTicker from '$lib/components/ui/NumberTicker.svelte';
	import Marquee from '$lib/components/ui/Marquee.svelte';
	import MagicCard from '$lib/components/ui/MagicCard.svelte';
	import BentoGrid from '$lib/components/ui/BentoGrid.svelte';
	import BentoCard from '$lib/components/ui/BentoCard.svelte';
	import Globe from '$lib/components/ui/Globe.svelte';
	import RetroGrid from '$lib/components/ui/RetroGrid.svelte';
	import NeonGradientCard from '$lib/components/ui/NeonGradientCard.svelte';
	import ShineBorder from '$lib/components/ui/ShineBorder.svelte';
	import PulsatingButton from '$lib/components/ui/PulsatingButton.svelte';
	import Confetti from '$lib/components/ui/Confetti.svelte';
	import AnimatedListItem from '$lib/components/ui/AnimatedListItem.svelte';

	let showConfetti = false;

	const directories = [
		{ name: 'Product Hunt', logo: '🚀' },
		{ name: 'BetaList', logo: '🅱️' },
		{ name: 'Hacker News', logo: '📰' },
		{ name: 'G2', logo: '⭐' },
		{ name: 'Capterra', logo: '📊' },
		{ name: 'AlternativeTo', logo: '🔄' },
		{ name: 'TechCrunch', logo: '💻' },
		{ name: 'IndieHackers', logo: '🏗️' },
		{ name: 'Reddit', logo: '🔴' },
		{ name: 'Dev.to', logo: '👨‍💻' },
		{ name: 'SaaSHub', logo: '🌐' },
		{ name: 'GetApp', logo: '📱' }
	];

	const features = [
		{
			name: 'Auto-Submit Engine',
			description: 'Our AI-powered engine automatically fills and submits your product to 400+ directories while you sleep.',
			icon: '🚀'
		},
		{
			name: 'AI Content Generation',
			description: 'Unique, compelling descriptions generated for each directory using Google Gemini AI.',
			icon: '🤖'
		},
		{
			name: 'Real-Time Dashboard',
			description: 'Track every submission status, success rate, and backlink in one beautiful dashboard.',
			icon: '📊'
		},
		{
			name: 'SEO Reports',
			description: 'Get detailed reports on your backlink profile, domain authority growth, and rankings.',
			icon: '📈'
		},
		{
			name: 'Smart Matching',
			description: 'We match your product to the most relevant directories based on industry and category.',
			icon: '🎯'
		},
		{
			name: 'Social Media Boost',
			description: 'Auto-post to Twitter, LinkedIn, and Reddit to maximize your launch impact.',
			icon: '📣'
		}
	];

	const testimonials = [
		{
			quote: "LinkLaunch saved me 40+ hours of manual submissions. My domain authority went from 15 to 45 in just 3 months!",
			author: "Sarah Chen",
			role: "Founder, TaskFlow",
			avatar: "👩‍💼"
		},
		{
			quote: "The ROI is insane. $79/month got me backlinks that would have cost $5,000+ from an SEO agency.",
			author: "Marcus Johnson",
			role: "CEO, DataSync Pro",
			avatar: "👨‍💻"
		},
		{
			quote: "We launched on 200+ directories in one day. The organic traffic increase was immediate and sustained.",
			author: "Emily Rodriguez",
			role: "Marketing Lead, CloudBase",
			avatar: "👩‍🚀"
		}
	];

	const steps = [
		{
			step: 1,
			title: 'Add Your Website',
			description: 'Enter your product details, upload your logo, and let our AI generate compelling descriptions.',
			icon: '📝'
		},
		{
			step: 2,
			title: 'We Launch to 400+ Directories',
			description: 'Our automation engine submits your product to hundreds of directories automatically.',
			icon: '🚀'
		},
		{
			step: 3,
			title: 'Watch Your Rankings Climb',
			description: 'Track your backlinks grow and watch your domain authority increase in real-time.',
			icon: '📈'
		}
	];

	function handlePricingClick() {
		showConfetti = true;
		setTimeout(() => showConfetti = false, 3000);
	}
</script>

<Confetti trigger={showConfetti} />

<div class="min-h-screen bg-background">
	<!-- Navigation -->
	<nav class="fixed top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
			<div class="flex items-center gap-2">
				<span class="text-2xl">🚀</span>
				<span class="text-xl font-bold text-white">LinkLaunch</span>
			</div>
			<div class="hidden items-center gap-8 md:flex">
				<a href="#features" class="text-sm text-muted-foreground transition hover:text-white">Features</a>
				<a href="#how-it-works" class="text-sm text-muted-foreground transition hover:text-white">How it Works</a>
				<a href="#pricing" class="text-sm text-muted-foreground transition hover:text-white">Pricing</a>
			</div>
			<div class="flex items-center gap-4">
				<a href="/auth/login" class="text-sm text-muted-foreground transition hover:text-white">Login</a>
				<ShimmerButton className="text-sm font-medium" href="/auth/signup">
					Get Started Free
				</ShimmerButton>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative min-h-screen overflow-hidden pt-16">
		<Particles className="absolute inset-0" quantity={150} color="#6366F1" />

		<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
			<div class="grid items-center gap-12 lg:grid-cols-2">
				<div class="text-center lg:text-left">
					<!-- Badge -->
					<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
						<span class="relative flex h-2 w-2">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
							<span class="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
						</span>
						400+ Directories Ready to Launch
					</div>

					<!-- Headline -->
					<h1 class="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
						Launch Your Links
						<br />
						<span class="text-gradient">Into Orbit</span>
					</h1>

					<!-- Subheadline with rotating words -->
					<p class="mb-4 text-xl text-muted-foreground">
						Submit your website to 400+ directories automatically and boost your
					</p>
					<div class="mb-8 text-2xl font-semibold text-white">
						<WordRotate
							words={['SEO Rankings', 'Domain Authority', 'Organic Traffic', 'Backlink Portfolio']}
							className="text-primary"
						/>
					</div>

					<!-- CTA Buttons -->
					<div class="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
						<ShimmerButton
							className="text-lg px-8 py-4 font-semibold"
							href="/auth/signup"
						>
							Start Launching Free
							<span class="ml-2">→</span>
						</ShimmerButton>
						<a
							href="#how-it-works"
							class="inline-flex items-center gap-2 text-muted-foreground transition hover:text-white"
						>
							<span class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20">
								▶
							</span>
							See How It Works
						</a>
					</div>

					<!-- Social Proof Stats -->
					<div class="mt-12 flex flex-wrap items-center justify-center gap-8 lg:justify-start">
						<div class="text-center">
							<div class="text-3xl font-bold text-white">
								<NumberTicker value={400} />+
							</div>
							<div class="text-sm text-muted-foreground">Directories</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-white">
								<NumberTicker value={50000} />+
							</div>
							<div class="text-sm text-muted-foreground">Links Built</div>
						</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-white">
								<NumberTicker value={2500} />+
							</div>
							<div class="text-sm text-muted-foreground">Happy Users</div>
						</div>
					</div>
				</div>

				<!-- Globe -->
				<div class="relative hidden lg:block">
					<div class="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]"></div>
					<Globe size={450} className="mx-auto" />
					<div class="absolute bottom-10 left-1/2 -translate-x-1/2">
						<p class="text-center text-sm text-muted-foreground">
							Submitting to directories worldwide
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Directory Marquee -->
	<section class="border-y border-white/10 bg-black/30 py-8">
		<div class="mx-auto max-w-7xl">
			<p class="mb-6 text-center text-sm text-muted-foreground">
				Trusted by leading directories and platforms
			</p>
			<Marquee pauseOnHover className="[--duration:30s]">
				{#each directories as dir}
					<div class="mx-8 flex items-center gap-3 text-xl text-white/60">
						<span class="text-3xl">{dir.logo}</span>
						<span class="font-medium">{dir.name}</span>
					</div>
				{/each}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:30s] mt-4">
				{#each [...directories].reverse() as dir}
					<div class="mx-8 flex items-center gap-3 text-xl text-white/60">
						<span class="text-3xl">{dir.logo}</span>
						<span class="font-medium">{dir.name}</span>
					</div>
				{/each}
			</Marquee>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="py-24">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-white sm:text-4xl">
					Everything You Need to
					<span class="text-gradient">Dominate SEO</span>
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Our powerful platform handles the tedious work of directory submissions so you can focus on building your product.
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature, i}
					<MagicCard className="p-6" gradientColor="#1a1a2e">
						<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
							{feature.icon}
						</div>
						<h3 class="mb-2 text-xl font-semibold text-white">{feature.name}</h3>
						<p class="text-muted-foreground">{feature.description}</p>
					</MagicCard>
				{/each}
			</div>
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="relative overflow-hidden py-24">
		<div class="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>

		<div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-white sm:text-4xl">
					Three Steps to
					<span class="text-gradient">SEO Success</span>
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Get your product in front of thousands of potential customers with minimal effort.
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				{#each steps as step, i}
					<AnimatedListItem index={i} delay={300}>
						<ShineBorder
							borderRadius={16}
							color={['#6366F1', '#EC4899']}
							className="h-full"
						>
							<div class="h-full rounded-2xl bg-card p-8">
								<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-bold text-white">
									{step.step}
								</div>
								<div class="mb-2 text-4xl">{step.icon}</div>
								<h3 class="mb-3 text-xl font-semibold text-white">{step.title}</h3>
								<p class="text-muted-foreground">{step.description}</p>
							</div>
						</ShineBorder>
					</AnimatedListItem>
				{/each}
			</div>
		</div>
	</section>

	<!-- Testimonials -->
	<section class="py-24">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-white sm:text-4xl">
					Loved by
					<span class="text-gradient">Founders & Marketers</span>
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Join thousands of successful products that launched with LinkLaunch.
				</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				{#each testimonials as testimonial, i}
					<MagicCard className="p-6" gradientColor="#1a1a2e">
						<div class="mb-4 text-4xl">{testimonial.avatar}</div>
						<p class="mb-6 text-lg text-white/90">"{testimonial.quote}"</p>
						<div>
							<div class="font-semibold text-white">{testimonial.author}</div>
							<div class="text-sm text-muted-foreground">{testimonial.role}</div>
						</div>
					</MagicCard>
				{/each}
			</div>
		</div>
	</section>

	<!-- Pricing Section -->
	<section id="pricing" class="py-24">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-white sm:text-4xl">
					Simple, Transparent
					<span class="text-gradient">Pricing</span>
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
					Choose the plan that fits your launch goals. All plans include our core submission engine.
				</p>
			</div>

			<div class="grid gap-8 lg:grid-cols-3">
				<!-- Liftoff Plan -->
				<div class="rounded-2xl border border-white/10 bg-card p-8">
					<div class="mb-6">
						<div class="mb-2 text-3xl">🚀</div>
						<h3 class="text-2xl font-bold text-white">Liftoff</h3>
						<p class="text-muted-foreground">For indie hackers & small launches</p>
					</div>
					<div class="mb-6">
						<span class="text-4xl font-bold text-white">$29</span>
						<span class="text-muted-foreground">/month</span>
					</div>
					<ul class="mb-8 space-y-3">
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> 50 directory submissions/month
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Basic directories (DA 20-50)
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> AI-generated descriptions
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Email support
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Basic analytics
						</li>
					</ul>
					<button
						class="w-full rounded-lg border border-white/20 py-3 font-medium text-white transition hover:bg-white/5"
						on:click={handlePricingClick}
					>
						Get Started
					</button>
				</div>

				<!-- Orbit Plan (Featured) -->
				<NeonGradientCard
					neonColors={{ firstColor: '#6366F1', secondColor: '#EC4899' }}
					className="relative"
				>
					<div class="absolute -top-4 left-1/2 -translate-x-1/2">
						<span class="rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-1 text-sm font-medium text-white">
							Most Popular
						</span>
					</div>
					<div class="p-8">
						<div class="mb-6">
							<div class="mb-2 text-3xl">⭐</div>
							<h3 class="text-2xl font-bold text-white">Orbit</h3>
							<p class="text-muted-foreground">For growing startups</p>
						</div>
						<div class="mb-6">
							<span class="text-4xl font-bold text-white">$79</span>
							<span class="text-muted-foreground">/month</span>
						</div>
						<ul class="mb-8 space-y-3">
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> 200 directory submissions/month
							</li>
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> Premium directories (DA 50-80)
							</li>
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> Social media auto-posting
							</li>
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> SEO reports
							</li>
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> Priority support
							</li>
							<li class="flex items-center gap-2 text-white">
								<span class="text-green-500">✓</span> Real-time tracking dashboard
							</li>
						</ul>
						<PulsatingButton
							className="w-full"
							on:click={handlePricingClick}
						>
							Get Started
						</PulsatingButton>
					</div>
				</NeonGradientCard>

				<!-- Galaxy Plan -->
				<div class="rounded-2xl border border-white/10 bg-card p-8">
					<div class="mb-6">
						<div class="mb-2 text-3xl">🌌</div>
						<h3 class="text-2xl font-bold text-white">Galaxy</h3>
						<p class="text-muted-foreground">For enterprises & agencies</p>
					</div>
					<div class="mb-6">
						<span class="text-4xl font-bold text-white">$199</span>
						<span class="text-muted-foreground">/month</span>
					</div>
					<ul class="mb-8 space-y-3">
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Unlimited submissions
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Elite directories (DA 80+)
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> White-label reports
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> API access
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Dedicated account manager
						</li>
						<li class="flex items-center gap-2 text-muted-foreground">
							<span class="text-green-500">✓</span> Custom integrations
						</li>
					</ul>
					<button
						class="w-full rounded-lg border border-white/20 py-3 font-medium text-white transition hover:bg-white/5"
						on:click={handlePricingClick}
					>
						Contact Sales
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="relative overflow-hidden py-24">
		<RetroGrid className="opacity-30" />

		<div class="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
			<h2 class="mb-6 text-4xl font-bold text-white sm:text-5xl">
				Ready to
				<span class="text-gradient">Launch?</span>
			</h2>
			<p class="mb-8 text-xl text-muted-foreground">
				Join 2,500+ founders who've already boosted their SEO with LinkLaunch.
				Start free today—no credit card required.
			</p>
			<ShimmerButton
				className="text-lg px-10 py-5 font-semibold"
				href="/auth/signup"
			>
				Start Launching Free
				<span class="ml-2">🚀</span>
			</ShimmerButton>
			<p class="mt-4 text-sm text-muted-foreground">
				14-day free trial • No credit card required • Cancel anytime
			</p>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-white/10 py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="grid gap-8 md:grid-cols-4">
				<div>
					<div class="mb-4 flex items-center gap-2">
						<span class="text-2xl">🚀</span>
						<span class="text-xl font-bold text-white">LinkLaunch</span>
					</div>
					<p class="text-sm text-muted-foreground">
						Launch your links into orbit. Build backlinks automatically and dominate SEO.
					</p>
				</div>
				<div>
					<h4 class="mb-4 font-semibold text-white">Product</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li><a href="#features" class="hover:text-white">Features</a></li>
						<li><a href="#pricing" class="hover:text-white">Pricing</a></li>
						<li><a href="#" class="hover:text-white">API</a></li>
						<li><a href="#" class="hover:text-white">Changelog</a></li>
					</ul>
				</div>
				<div>
					<h4 class="mb-4 font-semibold text-white">Company</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li><a href="#" class="hover:text-white">About</a></li>
						<li><a href="#" class="hover:text-white">Blog</a></li>
						<li><a href="#" class="hover:text-white">Careers</a></li>
						<li><a href="#" class="hover:text-white">Contact</a></li>
					</ul>
				</div>
				<div>
					<h4 class="mb-4 font-semibold text-white">Legal</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li><a href="#" class="hover:text-white">Privacy Policy</a></li>
						<li><a href="#" class="hover:text-white">Terms of Service</a></li>
						<li><a href="#" class="hover:text-white">Cookie Policy</a></li>
					</ul>
				</div>
			</div>
			<div class="mt-12 border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
				© 2024 LinkLaunch. All rights reserved.
			</div>
		</div>
	</footer>
</div>
