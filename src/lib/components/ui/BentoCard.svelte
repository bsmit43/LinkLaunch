<script lang="ts">
	import { cn } from '$lib/utils';
	import BorderBeam from './BorderBeam.svelte';

	export let name: string;
	export let className: string = '';
	export let background: any = null;
	export let description: string;
	export let href: string = '#';
	export let cta: string = 'Learn more';
</script>

<div
	class={cn(
		'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl',
		'bg-white/5 border border-white/10',
		'transform-gpu transition-all duration-300 hover:border-white/20',
		className
	)}
>
	<div class="pointer-events-none absolute inset-0 z-0">
		{#if background}
			<svelte:component this={background} />
		{/if}
	</div>
	<div class="z-10 flex flex-col gap-1 p-6 transition-all duration-300">
		<h3 class="text-xl font-semibold text-white">
			{name}
		</h3>
		<p class="max-w-lg text-muted-foreground">{description}</p>
	</div>

	<div
		class={cn(
			'pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100'
		)}
	>
		<a
			{href}
			class="pointer-events-auto inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
		>
			{cta}
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</a>
	</div>
	<BorderBeam size={200} duration={12} delay={0} colorFrom="#6366F1" colorTo="#EC4899" />
</div>
