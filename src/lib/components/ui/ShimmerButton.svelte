<script lang="ts">
	import { cn } from '$lib/utils';

	export let shimmerColor: string = '#ffffff';
	export let shimmerSize: string = '0.05em';
	export let shimmerDuration: string = '3s';
	export let borderRadius: string = '100px';
	export let background: string = 'rgba(0, 0, 0, 1)';
	export let className: string = '';
	export let disabled: boolean = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	let href: string | undefined = undefined;
	export { href };
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	{href}
	type={href ? undefined : type}
	{disabled}
	role={href ? undefined : 'button'}
	class={cn(
		'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white',
		'transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px',
		disabled && 'cursor-not-allowed opacity-50',
		className
	)}
	style="--shimmer-color: {shimmerColor}; --radius: {borderRadius}; --speed: {shimmerDuration}; --cut: {shimmerSize}; --bg: {background}; border-radius: var(--radius);"
	on:click
>
	<!-- spark container -->
	<div
		class={cn(
			'-z-30 blur-[2px]',
			'absolute inset-0 overflow-visible [container-type:size]'
		)}
	>
		<!-- spark -->
		<div
			class="absolute inset-0 h-[100cqh] animate-shimmer [aspect-ratio:1] [border-radius:0] [mask:none]"
		>
			<!-- spark before -->
			<div
				class="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]"
				style="--spread: 90deg;"
			></div>
		</div>
	</div>
	<slot />

	<!-- Highlight -->
	<div
		class={cn(
			'insert-0 absolute size-full',
			'rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]',
			'transform-gpu transition-all duration-300 ease-in-out',
			'group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]',
			'group-active:shadow-[inset_0_-10px_10px_#ffffff3f]'
		)}
	></div>

	<!-- backdrop -->
	<div
		class={cn(
			'absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]'
		)}
	></div>
</svelte:element>

<style>
	@keyframes spin-around {
		0% {
			transform: translateZ(0) rotate(0);
		}
		15%,
		35% {
			transform: translateZ(0) rotate(90deg);
		}
		65%,
		85% {
			transform: translateZ(0) rotate(270deg);
		}
		100% {
			transform: translateZ(0) rotate(360deg);
		}
	}

	:global(.animate-spin-around) {
		animation: spin-around calc(var(--speed) * 2) infinite linear;
	}

	:global(.animate-shimmer) {
		animation: shimmer 8s infinite;
	}

	@keyframes shimmer {
		0%,
		90%,
		100% {
			background-position: calc(-100% - var(--shimmer-size)) 0;
		}
		30%,
		60% {
			background-position: calc(100% + var(--shimmer-size)) 0;
		}
	}
</style>
