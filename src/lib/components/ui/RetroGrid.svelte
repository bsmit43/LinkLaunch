<script lang="ts">
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let angle: number = 65;
</script>

<div
	class={cn(
		'pointer-events-none absolute size-full overflow-hidden opacity-50 [perspective:200px]',
		className
	)}
	style="--grid-angle: {angle}deg;"
>
	<!-- Grid -->
	<div class="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
		<div
			class={cn(
				'animate-grid',
				'[background-repeat:repeat] [background-size:60px_60px] [height:300vh] [inset:0%_0px] [margin-left:-50%] [transform-origin:100%_0_0] [width:600vw]',
				'[background-image:linear-gradient(to_right,rgba(99,102,241,0.3)_1px,transparent_0),linear-gradient(to_bottom,rgba(99,102,241,0.3)_1px,transparent_0)]'
			)}
		></div>
	</div>

	<!-- Background Gradient -->
	<div
		class="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%"
	></div>
</div>

<style>
	@keyframes grid {
		0% {
			transform: translateY(-50%);
		}
		100% {
			transform: translateY(0);
		}
	}

	:global(.animate-grid) {
		animation: grid 20s linear infinite;
	}
</style>
