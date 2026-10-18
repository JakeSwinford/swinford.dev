// The mark drawn live on a canvas, so it can move. Every frame engraves the surface with the
// same line screen as the static cuts in mark.ts; instead of a precomputed outline, the bars are
// clipped to the surface's own triangles.

import {
	diagonal,
	fit,
	LIGHT,
	project,
	quinticMesh,
	type Face,
	type Frame,
	type Vec3
} from './quintic.ts';
import { BOX, bars, grid, type ScreenOptions } from './screen.ts';

export interface Pose {
	/** Turn about the surface's vertical axis, in radians from the resting view. */
	turn?: number;
	/** Swing of the light around the line of sight, in radians from where it rests. */
	light?: number;
	/** How much of the screen is printed, top to bottom, from 0 to 1. */
	ink?: number;
}

/** How far past its box the mark reaches as it turns, as a fraction of the box. */
export const BLEED = 0.04;

let mesh: Vec3[][] | undefined;

export class LiveMark {
	readonly #mesh: Vec3[][];
	readonly #frame: Frame;
	readonly #screen: ScreenOptions;
	/** Pins the stripes so they hold still while the surface turns through them. */
	readonly #through: number;

	constructor(screen: ScreenOptions) {
		this.#mesh = mesh ??= quinticMesh();
		this.#frame = fit(this.#mesh, diagonal, BOX);
		this.#screen = screen;
		this.#through = grid(project(this.#mesh, diagonal, this.#frame), screen.pitch).y;
	}

	/** Draws the mark in `pose`, filling a `size`-pixel square at the context's origin. */
	draw(ctx: CanvasRenderingContext2D, size: number, { turn = 0, light = 0, ink = 1 }: Pose = {}) {
		const faces = project(
			this.#mesh,
			{ ...diagonal, yaw: diagonal.yaw + turn },
			this.#frame,
			swing(LIGHT, light)
		);
		const lines = grid(faces, this.#screen.pitch, this.#through);
		// The stripe being printed, and how far along it the ink has reached.
		const printed = ink * lines.count;
		const head = lines.x0 + (printed % 1) * (lines.x1 - lines.x0);

		ctx.save();
		ctx.scale(size / BOX, size / BOX);
		ctx.clip(outline(faces));
		ctx.beginPath();
		for (const { left, right, y, thickness } of bars(faces, lines, this.#screen)) {
			const line = Math.round((y - lines.y) / this.#screen.pitch);
			if (line > printed) break;
			const end = line < Math.floor(printed) ? right : Math.min(right, head);
			if (end > left) ctx.rect(left, y - thickness / 2, end - left, thickness);
		}
		ctx.fill();
		ctx.restore();
	}
}

/**
 * Every face as two triangles wound the same way, so their union fills under non-zero. Fills
 * close subpaths on their own; an explicit closePath() costs Chrome 60ms here.
 */
function outline(faces: Face[]): Path2D {
	const path = new Path2D();
	for (const {
		points: [a, b, c, d]
	} of faces) {
		for (const [p, q, r] of [
			[a, b, c],
			[a, c, d]
		]) {
			const clockwise = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]) > 0;
			const [s, t] = clockwise ? [q, r] : [r, q];
			path.moveTo(...p);
			path.lineTo(...s);
			path.lineTo(...t);
		}
	}
	return path;
}

/** `light` turned by `angle` around the line of sight. */
function swing([x, y, z]: Vec3, angle: number): Vec3 {
	const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
	return [x * cos - y * sin, x * sin + y * cos, z];
}
