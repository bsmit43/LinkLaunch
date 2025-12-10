<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let trigger: boolean = false;
	export let particleCount: number = 100;
	export let spread: number = 70;

	let canvasRef: HTMLCanvasElement;
	let particles: Particle[] = [];
	let animationId: number;

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		color: string;
		size: number;
		rotation: number;
		rotationSpeed: number;
		opacity: number;
	}

	const colors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

	function createParticles() {
		if (!canvasRef || !browser) return;

		const rect = canvasRef.getBoundingClientRect();
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		particles = [];
		for (let i = 0; i < particleCount; i++) {
			const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180) - Math.PI / 2;
			const velocity = 8 + Math.random() * 8;

			particles.push({
				x: centerX,
				y: centerY,
				vx: Math.cos(angle) * velocity * (Math.random() - 0.5) * 2,
				vy: Math.sin(angle) * velocity - Math.random() * 3,
				color: colors[Math.floor(Math.random() * colors.length)],
				size: 4 + Math.random() * 6,
				rotation: Math.random() * 360,
				rotationSpeed: (Math.random() - 0.5) * 10,
				opacity: 1
			});
		}
	}

	function animate() {
		if (!canvasRef || !browser) return;
		const ctx = canvasRef.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);

		let activeParticles = 0;

		particles.forEach((p) => {
			if (p.opacity <= 0) return;
			activeParticles++;

			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.3; // gravity
			p.vx *= 0.99;
			p.rotation += p.rotationSpeed;
			p.opacity -= 0.008;

			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate((p.rotation * Math.PI) / 180);
			ctx.globalAlpha = Math.max(0, p.opacity);
			ctx.fillStyle = p.color;
			ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
			ctx.restore();
		});

		if (activeParticles > 0) {
			animationId = requestAnimationFrame(animate);
		}
	}

	function fire() {
		createParticles();
		animate();
	}

	$: if (trigger && browser) {
		fire();
	}

	onMount(() => {
		if (!browser) return;
		if (canvasRef) {
			canvasRef.width = window.innerWidth;
			canvasRef.height = window.innerHeight;
		}
	});

	onDestroy(() => {
		if (!browser) return;
		if (animationId) cancelAnimationFrame(animationId);
	});
</script>

<canvas
	bind:this={canvasRef}
	class="pointer-events-none fixed inset-0 z-50"
	style="width: 100vw; height: 100vh;"
></canvas>
