<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';

	export let className: string = '';
	export let quantity: number = 100;
	export let staticity: number = 50;
	export let ease: number = 50;
	export let size: number = 0.4;
	export let color: string = '#ffffff';
	export let vx: number = 0;
	export let vy: number = 0;

	let canvasRef: HTMLCanvasElement;
	let containerRef: HTMLDivElement;
	let context: CanvasRenderingContext2D | null = null;
	let circles: Circle[] = [];
	let mouse = { x: 0, y: 0 };
	let canvasSize = { w: 0, h: 0 };
	let rafID: number;
	let mounted = false;

	interface Circle {
		x: number;
		y: number;
		translateX: number;
		translateY: number;
		size: number;
		alpha: number;
		targetAlpha: number;
		dx: number;
		dy: number;
		magnetism: number;
	}

	function hexToRgb(hex: string): number[] {
		hex = hex.replace('#', '');
		if (hex.length === 3) {
			hex = hex.split('').map((char) => char + char).join('');
		}
		const hexInt = parseInt(hex, 16);
		const red = (hexInt >> 16) & 255;
		const green = (hexInt >> 8) & 255;
		const blue = hexInt & 255;
		return [red, green, blue];
	}

	const rgb = hexToRgb(color);

	function circleParams(): Circle {
		const x = Math.floor(Math.random() * canvasSize.w);
		const y = Math.floor(Math.random() * canvasSize.h);
		const pSize = Math.floor(Math.random() * 2) + size;
		const alpha = 0;
		const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
		const dx = (Math.random() - 0.5) * 0.1;
		const dy = (Math.random() - 0.5) * 0.1;
		const magnetism = 0.1 + Math.random() * 4;
		return {
			x,
			y,
			translateX: 0,
			translateY: 0,
			size: pSize,
			alpha,
			targetAlpha,
			dx,
			dy,
			magnetism
		};
	}

	function drawCircle(circle: Circle, update = false) {
		if (!context || !browser) return;
		const { x, y, translateX, translateY, size: circleSize, alpha } = circle;
		context.translate(translateX, translateY);
		context.beginPath();
		context.arc(x, y, circleSize, 0, 2 * Math.PI);
		context.fillStyle = `rgba(${rgb.join(', ')}, ${alpha})`;
		context.fill();
		const dpr = window.devicePixelRatio || 1;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		if (!update) {
			circles.push(circle);
		}
	}

	function resizeCanvas() {
		if (!containerRef || !canvasRef || !context || !browser) return;
		canvasSize.w = containerRef.offsetWidth;
		canvasSize.h = containerRef.offsetHeight;
		const dpr = window.devicePixelRatio || 1;
		canvasRef.width = canvasSize.w * dpr;
		canvasRef.height = canvasSize.h * dpr;
		canvasRef.style.width = `${canvasSize.w}px`;
		canvasRef.style.height = `${canvasSize.h}px`;
		context.scale(dpr, dpr);
		circles = [];
		for (let i = 0; i < quantity; i++) {
			const circle = circleParams();
			drawCircle(circle);
		}
	}

	function animate() {
		if (!context || !browser) return;
		context.clearRect(0, 0, canvasSize.w, canvasSize.h);
		circles.forEach((circle, i) => {
			const edge = [
				circle.x + circle.translateX - circle.size,
				canvasSize.w - circle.x - circle.translateX - circle.size,
				circle.y + circle.translateY - circle.size,
				canvasSize.h - circle.y - circle.translateY - circle.size
			];
			const closestEdge = edge.reduce((a, b) => Math.min(a, b));
			const remapClosestEdge = parseFloat(
				Math.max(0, Math.min(1, closestEdge / 20)).toFixed(2)
			);
			if (remapClosestEdge > 1) {
				circle.alpha += 0.02;
				if (circle.alpha > circle.targetAlpha) {
					circle.alpha = circle.targetAlpha;
				}
			} else {
				circle.alpha = circle.targetAlpha * remapClosestEdge;
			}
			circle.x += circle.dx + vx;
			circle.y += circle.dy + vy;
			circle.translateX +=
				(mouse.x / (staticity / circle.magnetism) - circle.translateX) / ease;
			circle.translateY +=
				(mouse.y / (staticity / circle.magnetism) - circle.translateY) / ease;
			drawCircle(circle, true);
			if (
				circle.x < -circle.size ||
				circle.x > canvasSize.w + circle.size ||
				circle.y < -circle.size ||
				circle.y > canvasSize.h + circle.size
			) {
				circles.splice(i, 1);
				const newCircle = circleParams();
				drawCircle(newCircle);
			}
		});
		rafID = requestAnimationFrame(animate);
	}

	function onMouseMove(e: MouseEvent) {
		if (!canvasRef) return;
		const rect = canvasRef.getBoundingClientRect();
		const x = e.clientX - rect.left - canvasSize.w / 2;
		const y = e.clientY - rect.top - canvasSize.h / 2;
		const inside =
			x < canvasSize.w / 2 && x > -canvasSize.w / 2 && y < canvasSize.h / 2 && y > -canvasSize.h / 2;
		if (inside) {
			mouse.x = x;
			mouse.y = y;
		}
	}

	onMount(() => {
		if (!browser) return;
		mounted = true;
		if (canvasRef) {
			context = canvasRef.getContext('2d');
		}
		resizeCanvas();
		animate();
		window.addEventListener('resize', resizeCanvas);
		window.addEventListener('mousemove', onMouseMove);
	});

	onDestroy(() => {
		if (!browser) return;
		if (rafID) cancelAnimationFrame(rafID);
		window.removeEventListener('resize', resizeCanvas);
		window.removeEventListener('mousemove', onMouseMove);
	});
</script>

<div bind:this={containerRef} class={cn('pointer-events-none', className)} aria-hidden="true">
	<canvas bind:this={canvasRef} class="size-full"></canvas>
</div>
