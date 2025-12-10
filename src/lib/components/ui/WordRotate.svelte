<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { cn } from '$lib/utils';

	export let words: string[];
	export let duration: number = 2500;
	export let className: string = '';

	let currentIndex = 0;
	let isAnimating = false;
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		interval = setInterval(() => {
			isAnimating = true;
			setTimeout(() => {
				currentIndex = (currentIndex + 1) % words.length;
				isAnimating = false;
			}, 300);
		}, duration);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});
</script>

<span class={cn('relative inline-block overflow-hidden', className)}>
	<span
		class="inline-block transition-all duration-300"
		class:translate-y-full={isAnimating}
		class:opacity-0={isAnimating}
	>
		{words[currentIndex]}
	</span>
</span>
