<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let reverse: boolean = false;
	export let duration: number = 20;
	export let delay: number = 10;
	export let radius: number = 50;
	export let path: boolean = true;
</script>

{#if path}
	<svg
		class="pointer-events-none absolute inset-0 size-full"
	>
		<circle
			class="stroke-white/10 stroke-1"
			cx="50%"
			cy="50%"
			r={radius}
			fill="none"
		/>
	</svg>
{/if}

<div
	style="--duration: {duration}s; --radius: {radius}px; --delay: {-delay}s;"
	class={cn(
		'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-black/10 [animation-delay:var(--delay)]',
		reverse && '[animation-direction:reverse]',
		className
	)}
>
	<slot />
</div>

<style>
	@keyframes orbit {
		0% {
			transform: rotate(0deg) translateY(calc(var(--radius) * 1)) rotate(0deg);
		}
		100% {
			transform: rotate(360deg) translateY(calc(var(--radius) * 1)) rotate(-360deg);
		}
	}

	:global(.animate-orbit) {
		animation: orbit var(--duration) linear infinite;
	}
</style>
