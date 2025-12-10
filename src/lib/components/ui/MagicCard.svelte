<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let gradientSize: number = 200;
	export let gradientColor: string = '#262626';
	export let gradientOpacity: number = 0.8;

	let mouseX = 0;
	let mouseY = 0;
	let cardRef: HTMLDivElement;

	function handleMouseMove(e: MouseEvent) {
		if (!cardRef) return;
		const rect = cardRef.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;
	}
</script>

<div
	bind:this={cardRef}
	class={cn(
		'group relative flex size-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-white/10 text-black dark:text-white',
		className
	)}
	on:mousemove={handleMouseMove}
	role="presentation"
>
	<div class="relative z-10 w-full">
		<slot />
	</div>
	<div
		class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
		style="background: radial-gradient({gradientSize}px circle at {mouseX}px {mouseY}px, {gradientColor}, transparent {gradientOpacity * 100}%)"
	></div>
</div>
