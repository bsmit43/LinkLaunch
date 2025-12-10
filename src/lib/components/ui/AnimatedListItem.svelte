<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { fade, fly } from 'svelte/transition';

	export let className: string = '';
	export let index: number = 0;
	export let delay: number = 200;

	let visible = false;

	onMount(() => {
		const timer = setTimeout(() => {
			visible = true;
		}, index * delay);

		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div
		in:fly={{ y: 20, duration: 400 }}
		class={cn('transform transition-all', className)}
	>
		<slot />
	</div>
{/if}
