<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { LiveMark, Pose } from './logo/live.ts';
	import { screen, screenSmall, solid, viewBox } from './mark.ts';

	let {
		size = 28,
		variant = 'screen',
		label,
		drift = false
	}: {
		size?: number | string;
		/** `screen` switches to a coarser cut below 64px so its stripes stay distinct. */
		variant?: 'solid' | 'screen';
		label?: string;
		/** Slowly circles the light around the surface while the mark is on screen. */
		drift?: boolean;
	} = $props();

	const TAU = 2 * Math.PI;
	/** One turn, in ms. */
	const TURN = 1400;
	/** One orbit of the drifting light, in ms. */
	const ORBIT = 24_000;

	const small = $derived(typeof size === 'number' && size < 64);
	const d = $derived(variant === 'solid' ? solid : small ? screenSmall : screen);

	// The static SVG is what renders on the server and whenever the mark is at rest. Motion
	// loads the live renderer on demand and draws over it on a canvas, whose first and last
	// frames land on the SVG.
	let box: HTMLSpanElement;
	let canvas = $state<HTMLCanvasElement>();
	let live = $state(false);
	let bleed = $state(0);
	let mark: LiveMark | undefined;
	let still = true;
	let visible = false;
	let frame = 0;
	/** When the current turn began; `queued` until its first frame, so loading doesn't eat into it. */
	let turning: number | 'queued' | undefined;
	let light = 0;
	let lastFrame = 0;
	let lastPaint = 0;

	/** Turns the surface once around. */
	export function turn() {
		if (turning === undefined && wake()) turning = 'queued';
	}

	function wake(): boolean {
		if (still || variant === 'solid') return false;
		void start();
		return true;
	}

	async function start() {
		if (!mark) {
			const [{ BLEED, LiveMark }, { coarse, fine }] = await Promise.all([
				import('./logo/live.ts'),
				import('./logo/screen.ts')
			]);
			mark ??= new LiveMark(small ? coarse : fine);
			bleed = BLEED;
		}
		live = true;
		await tick();
		frame ||= requestAnimationFrame(draw);
	}

	function draw(now: number) {
		frame = 0;
		if (turning === 'queued') turning = now;
		const progress = turning === undefined ? 1 : Math.min(1, (now - turning) / TURN);
		// Capped, so the light doesn't jump after the loop has been paused.
		if (drift && visible) light += (Math.min(now - lastFrame, 50) / ORBIT) * TAU;
		lastFrame = now;
		// While only the light moves, 24fps is plenty.
		if (turning !== undefined || now - lastPaint > 40) {
			paint({ turn: ease(progress) * TAU, light });
			lastPaint = now;
		}
		if (progress === 1) turning = undefined;

		if (turning !== undefined || (drift && visible)) frame = requestAnimationFrame(draw);
		else if (!drift) live = false;
	}

	function paint(pose: Pose) {
		if (!canvas || !mark) return;
		const px = box.clientWidth;
		const dpr = devicePixelRatio || 1;
		const side = Math.round(px * (1 + 2 * bleed) * dpr);
		if (canvas.width !== side) canvas.width = canvas.height = side;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, side, side);
		ctx.setTransform(dpr, 0, 0, dpr, px * bleed * dpr, px * bleed * dpr);
		ctx.fillStyle = getComputedStyle(box).color;
		mark.draw(ctx, px, pose);
	}

	const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2);

	onMount(() => {
		still = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const observer = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			if (visible && drift) wake();
		});
		observer.observe(box);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<span class="mark" bind:this={box} style:width={typeof size === 'number' ? `${size}px` : size}>
	<svg
		{viewBox}
		fill="currentColor"
		class:hidden={live}
		role={label ? 'img' : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : 'true'}
	>
		<path {d} fill-rule="evenodd" />
	</svg>
	{#if live}
		<canvas
			bind:this={canvas}
			aria-hidden="true"
			style:inset="{-bleed * 100}%"
			style:width="{(1 + 2 * bleed) * 100}%"
		></canvas>
	{/if}
</span>

<style>
	.mark {
		position: relative;
		display: block;
		flex: none;
		aspect-ratio: 1;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.hidden {
		visibility: hidden;
	}

	canvas {
		position: absolute;
		aspect-ratio: 1;
		pointer-events: none;
	}
</style>
