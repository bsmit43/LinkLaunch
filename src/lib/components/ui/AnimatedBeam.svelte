<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let containerRef: HTMLElement | null = null;
	export let fromRef: HTMLElement | null = null;
	export let toRef: HTMLElement | null = null;
	export let curvature: number = 0;
	export let reverse: boolean = false;
	export let pathColor: string = 'gray';
	export let pathWidth: number = 2;
	export let pathOpacity: number = 0.2;
	export let gradientStartColor: string = '#6366F1';
	export let gradientStopColor: string = '#EC4899';
	export let delay: number = 0;
	export let duration: number = 4;
	export let startXOffset: number = 0;
	export let startYOffset: number = 0;
	export let endXOffset: number = 0;
	export let endYOffset: number = 0;

	let pathD = '';
	let svgWidth = 0;
	let svgHeight = 0;
	let gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

	function updatePath() {
		if (!containerRef || !fromRef || !toRef) return;

		const containerRect = containerRef.getBoundingClientRect();
		const fromRect = fromRef.getBoundingClientRect();
		const toRect = toRef.getBoundingClientRect();

		const fromX = fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
		const fromY = fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
		const toX = toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
		const toY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

		svgWidth = containerRect.width;
		svgHeight = containerRect.height;

		const controlX = (fromX + toX) / 2;
		const controlY = (fromY + toY) / 2 + curvature;

		pathD = `M ${fromX},${fromY} Q ${controlX},${controlY} ${toX},${toY}`;
	}

	onMount(() => {
		updatePath();
		window.addEventListener('resize', updatePath);
		return () => window.removeEventListener('resize', updatePath);
	});

	$: if (containerRef && fromRef && toRef) {
		updatePath();
	}
</script>

<svg
	fill="none"
	width={svgWidth}
	height={svgHeight}
	class={cn('pointer-events-none absolute left-0 top-0', className)}
>
	<defs>
		<linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
			<stop stop-color={gradientStartColor} stop-opacity="0" offset="0%" />
			<stop stop-color={gradientStartColor} offset="10%" />
			<stop stop-color={gradientStopColor} offset="90%" />
			<stop stop-color={gradientStopColor} stop-opacity="0" offset="100%" />
		</linearGradient>
	</defs>
	<path
		d={pathD}
		stroke={pathColor}
		stroke-width={pathWidth}
		stroke-opacity={pathOpacity}
		stroke-linecap="round"
	/>
	<path
		d={pathD}
		stroke-width={pathWidth}
		stroke="url(#{gradientId})"
		stroke-linecap="round"
		class="animate-beam"
		style="--beam-duration: {duration}s; --beam-delay: {delay}s; --beam-direction: {reverse ? 'reverse' : 'normal'};"
	/>
</svg>

<style>
	@keyframes beam {
		0% {
			stroke-dashoffset: 100%;
		}
		100% {
			stroke-dashoffset: -100%;
		}
	}

	:global(.animate-beam) {
		stroke-dasharray: 50% 50%;
		animation: beam var(--beam-duration) var(--beam-delay) linear infinite var(--beam-direction);
	}
</style>
