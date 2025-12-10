<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let borderSize: number = 2;
	export let borderRadius: number = 20;
	export let neonColors: { firstColor: string; secondColor: string } = {
		firstColor: '#ff00aa',
		secondColor: '#00FFF1'
	};
</script>

<div
	class={cn(
		'relative z-10 size-full rounded-[var(--border-radius)]',
		className
	)}
	style="--border-size: {borderSize}px; --border-radius: {borderRadius}px; --neon-first-color: {neonColors.firstColor}; --neon-second-color: {neonColors.secondColor}; --card-content-radius: calc(var(--border-radius) - var(--border-size));"
>
	<div
		class={cn(
			'relative size-full min-h-[inherit] rounded-[var(--card-content-radius)] bg-card p-6',
			'before:absolute before:-left-[var(--border-size)] before:-top-[var(--border-size)] before:-z-10 before:block',
			"before:h-[calc(100%+calc(var(--border-size)*2))] before:w-[calc(100%+calc(var(--border-size)*2))] before:rounded-[var(--border-radius)] before:content-['']",
			'before:bg-[linear-gradient(0deg,var(--neon-first-color),var(--neon-second-color))] before:bg-[length:100%_200%]',
			"before:animate-background-position-spin"
		)}
	>
		<slot />
	</div>
</div>

<style>
	@keyframes background-position-spin {
		0% {
			background-position: top center;
		}
		100% {
			background-position: bottom center;
		}
	}

	:global(.animate-background-position-spin) {
		animation: background-position-spin 3s linear infinite alternate;
	}
</style>
