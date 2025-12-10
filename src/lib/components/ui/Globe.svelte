<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let size: number = 400;

	let canvasRef: HTMLCanvasElement;
	let animationId: number;

	const DOTS = 1500;
	const DOT_RADIUS = 1.2;

	interface Dot {
		phi: number;
		theta: number;
		x: number;
		y: number;
		z: number;
	}

	let dots: Dot[] = [];
	let rotation = 0;

	function initDots() {
		dots = [];
		for (let i = 0; i < DOTS; i++) {
			const phi = Math.acos(-1 + (2 * i) / DOTS);
			const theta = Math.sqrt(DOTS * Math.PI) * phi;
			dots.push({
				phi,
				theta,
				x: 0,
				y: 0,
				z: 0
			});
		}
	}

	function project(dot: Dot, r: number): { x: number; y: number; z: number } {
		const x = r * Math.sin(dot.phi) * Math.cos(dot.theta + rotation);
		const y = r * Math.cos(dot.phi);
		const z = r * Math.sin(dot.phi) * Math.sin(dot.theta + rotation) + r;
		return { x, y, z };
	}

	function draw() {
		if (!canvasRef || !browser) return;
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		const centerX = size / 2;
		const centerY = size / 2;
		const radius = size * 0.35;

		ctx.clearRect(0, 0, size, size);

		// Sort dots by z for depth effect
		const projectedDots = dots.map((dot) => {
			const proj = project(dot, radius);
			return { ...proj, original: dot };
		});

		projectedDots.sort((a, b) => a.z - b.z);

		projectedDots.forEach((dot) => {
			const scale = dot.z / (radius * 2);
			const alpha = Math.max(0.1, scale);
			const dotSize = DOT_RADIUS * scale * 1.5;

			if (dot.z > 0) {
				ctx.beginPath();
				ctx.arc(centerX + dot.x, centerY + dot.y, Math.max(0.5, dotSize), 0, Math.PI * 2);
				ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
				ctx.fill();
			}
		});

		rotation += 0.003;
		animationId = requestAnimationFrame(draw);
	}

	onMount(() => {
		if (!browser) return;
		initDots();
		draw();
	});

	onDestroy(() => {
		if (!browser) return;
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	});
</script>

<div class={cn('relative', className)}>
	<canvas
		bind:this={canvasRef}
		width={size}
		height={size}
		class="opacity-80"
	></canvas>
	<!-- Glow effect -->
	<div
		class="absolute inset-0 rounded-full"
		style="background: radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 70%); pointer-events: none;"
	></div>
</div>
