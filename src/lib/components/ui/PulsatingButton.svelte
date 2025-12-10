<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let pulseColor: string = '#6366F1';
	export let duration: string = '1.5s';
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
		'relative text-center cursor-pointer flex justify-center items-center rounded-lg text-white bg-primary px-6 py-3 font-medium',
		disabled && 'cursor-not-allowed opacity-50',
		className
	)}
	style="--pulse-color: {pulseColor}; --duration: {duration};"
	on:click
>
	<div class="relative z-10">
		<slot />
	</div>
	<div class="absolute top-1/2 left-1/2 size-full rounded-lg bg-inherit animate-pulse-ring -translate-x-1/2 -translate-y-1/2"></div>
</svelte:element>

<style>
	@keyframes pulse-ring {
		0% {
			transform: translate(-50%, -50%) scale(0.33);
			opacity: 0.8;
		}
		80%,
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.2);
		}
	}

	:global(.animate-pulse-ring) {
		animation: pulse-ring var(--duration) cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
	}
</style>
