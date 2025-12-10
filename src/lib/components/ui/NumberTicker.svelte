<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	export let value: number;
	export let direction: 'up' | 'down' = 'up';
	export let delay: number = 0;
	export let decimalPlaces: number = 0;
	export let className: string = '';

	let displayValue = direction === 'down' ? value : 0;
	let mounted = false;

	onMount(() => {
		mounted = true;
		const timeout = setTimeout(() => {
			const duration = 2000;
			const startTime = performance.now();
			const startValue = direction === 'down' ? value : 0;
			const endValue = direction === 'down' ? 0 : value;

			function animate(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function (ease-out)
				const easeOut = 1 - Math.pow(1 - progress, 3);

				displayValue = startValue + (endValue - startValue) * easeOut;

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					displayValue = endValue;
				}
			}

			requestAnimationFrame(animate);
		}, delay);

		return () => clearTimeout(timeout);
	});
</script>

<span class={cn('inline-block tabular-nums tracking-wider', className)}>
	{displayValue.toFixed(decimalPlaces)}
</span>
