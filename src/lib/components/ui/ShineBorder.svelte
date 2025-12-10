<script lang="ts">
	import { cn } from '$lib/utils';

	export let borderRadius: number = 8;
	export let borderWidth: number = 1;
	export let duration: number = 14;
	export let color: string | string[] = '#6366F1';
	export let className: string = '';

	$: colorString = Array.isArray(color) ? color.join(',') : color;
</script>

<div
	style="--border-radius: {borderRadius}px; --border-width: {borderWidth}px; --shine-duration: {duration}s; --shine-color: {colorString}; background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(120,119,198,0.15), transparent);"
	class={cn(
		'relative rounded-[var(--border-radius)] bg-white/5 p-[var(--border-width)]',
		'before:absolute before:inset-0 before:rounded-[var(--border-radius)] before:p-[var(--border-width)]',
		'before:bg-[linear-gradient(90deg,transparent_25%,var(--shine-color)_50%,transparent_75%)] before:bg-[length:250%_100%] before:animate-shine-border',
		'before:![mask-composite:subtract] before:[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]',
		className
	)}
>
	<slot />
</div>

<style>
	@keyframes shine-border {
		from {
			background-position: 200% center;
		}
		to {
			background-position: -200% center;
		}
	}

	:global(.animate-shine-border) {
		animation: shine-border var(--shine-duration) linear infinite;
	}
</style>
