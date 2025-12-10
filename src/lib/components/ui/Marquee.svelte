<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let reverse: boolean = false;
	export let pauseOnHover: boolean = false;
	export let vertical: boolean = false;
	export let repeat: number = 4;
</script>

<div
	class={cn(
		'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
		vertical ? 'flex-col' : 'flex-row',
		className
	)}
>
	{#each Array(repeat) as _, i}
		<div
			class={cn('flex shrink-0 justify-around [gap:var(--gap)]', vertical ? 'flex-col' : 'flex-row', {
				'animate-marquee': !vertical,
				'animate-marquee-vertical': vertical,
				'group-hover:[animation-play-state:paused]': pauseOnHover,
				'[animation-direction:reverse]': reverse
			})}
		>
			<slot />
		</div>
	{/each}
</div>

<style>
	@keyframes marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(calc(-100% - var(--gap)));
		}
	}

	@keyframes marquee-vertical {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(calc(-100% - var(--gap)));
		}
	}

	:global(.animate-marquee) {
		animation: marquee var(--duration) linear infinite;
	}

	:global(.animate-marquee-vertical) {
		animation: marquee-vertical var(--duration) linear infinite;
	}
</style>
