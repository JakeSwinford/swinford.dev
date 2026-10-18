// The line screen the mark is engraved with. The static cuts in scripts/generate-logo.ts and
// the live canvas in live.ts lay out their bars with the same code, so a moving mark comes to
// rest exactly on the static one.

import type { Face, Point } from './quintic.ts';

export interface ScreenOptions {
	/** Distance between stripe centers. */
	pitch: number;
	/** Stripe thickness as a fraction of the pitch, from the darkest tone to the lightest. */
	weights: number[];
	/** Tone runs shorter than this are absorbed by their neighbor. */
	minRun: number;
	/** Sampling resolution along each stripe. */
	step?: number;
}

/** The mark is drawn in a square box this many units wide. */
export const BOX = 148;

/** For display sizes. */
export const fine: ScreenOptions = { pitch: 3.4, minRun: 5, weights: [0.88, 0.6, 0.34, 0.14] };

/** Fewer, heavier stripes, so each one still lands on a pixel at 24–48px. */
export const coarse: ScreenOptions = { pitch: 10, minRun: 14, weights: [0.9, 0.7, 0.5, 0.32] };

/** `count` stripes, the first at `y`, sampled from `x0` to `x1`. */
export interface Grid {
	x0: number;
	x1: number;
	y: number;
	count: number;
}

/** One run of a stripe: `left` to `right` along `y`, `thickness` tall. */
export interface Bar {
	left: number;
	right: number;
	y: number;
	thickness: number;
}

interface Run {
	tone: number;
	from: number;
	to: number;
}

const EMPTY = -1;

/**
 * The stripes that cross the faces. They're centered on the faces, so the first and last are
 * equally trimmed, unless `through` pins one stripe to keep the screen still while the faces move.
 */
export function grid(faces: Face[], pitch: number, through?: number): Grid {
	const [minX, minY, maxX, maxY] = extent(faces);
	const y = through ?? (minY + maxY) / 2 - (Math.floor((maxY - minY) / pitch) * pitch) / 2;
	const first = Math.ceil((minY - y) / pitch);
	const last = Math.floor((maxY - y) / pitch);
	return { x0: minX - pitch, x1: maxX + pitch, y: y + first * pitch, count: last - first + 1 };
}

/**
 * Engraves the faces as a horizontal line screen, the way mid-century symbols render volume in
 * one ink: each stripe thickens where its face turns away from the light. Visibility is resolved
 * along every stripe with the painter's algorithm. Ends that meet empty space overshoot by a
 * stripe, so the bars still need clipping to the surface's outline.
 */
export function bars(
	faces: Face[],
	{ x0, x1, y, count }: Grid,
	{ pitch, weights, minRun, step = 0.05 }: ScreenOptions
): Bar[] {
	const cells = Math.ceil((x1 - x0) / step);
	const rows = new Int8Array(count * cells).fill(EMPTY);
	const toneOf = (light: number) =>
		Math.min(weights.length - 1, Math.floor(light * weights.length));

	for (const { points, light } of [...faces].sort((a, b) => a.depth - b.depth)) {
		const tone = toneOf(light);
		const [a, b, c, d] = points;
		for (const triangle of [
			[a, b, c],
			[a, c, d]
		]) {
			const ys = triangle.map((p) => p[1]);
			const first = Math.max(0, Math.ceil((Math.min(...ys) - y) / pitch));
			const last = Math.min(count - 1, Math.floor((Math.max(...ys) - y) / pitch));
			for (let line = first; line <= last; line++) {
				const span = crossing(triangle, y + line * pitch);
				if (!span) continue;
				const from = Math.max(0, Math.ceil((span[0] - x0) / step - 0.5));
				const to = Math.min(cells - 1, Math.floor((span[1] - x0) / step - 0.5));
				if (from <= to) rows.fill(tone, line * cells + from, line * cells + to + 1);
			}
		}
	}

	const out: Bar[] = [];
	for (let line = 0; line < count; line++) {
		const runs = absorbShort(
			toRuns(rows.subarray(line * cells, (line + 1) * cells)),
			minRun / step
		);
		for (const [i, { tone, from, to }] of runs.entries()) {
			if (tone === EMPTY) continue;
			const left = i === 0 || runs[i - 1].tone === EMPTY ? pitch : 0;
			const right = i === runs.length - 1 || runs[i + 1].tone === EMPTY ? pitch : 0;
			out.push({
				left: x0 + from * step - left,
				right: x0 + (to + 1) * step + right,
				y: y + line * pitch,
				thickness: weights[tone] * pitch
			});
		}
	}
	return out;
}

function extent(faces: Face[]): [minX: number, minY: number, maxX: number, maxY: number] {
	let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
	for (const { points } of faces) {
		for (const [x, y] of points) {
			[minX, minY, maxX, maxY] = [
				Math.min(minX, x),
				Math.min(minY, y),
				Math.max(maxX, x),
				Math.max(maxY, y)
			];
		}
	}
	return [minX, minY, maxX, maxY];
}

/** Where the horizontal line at `y` enters and leaves a triangle, if it touches it. */
function crossing(triangle: Point[], y: number): [number, number] | undefined {
	let lo = Infinity;
	let hi = -Infinity;
	for (let i = 0; i < 3; i++) {
		const [ax, ay] = triangle[i];
		const [bx, by] = triangle[(i + 1) % 3];
		if ((ay - y) * (by - y) > 0 || ay === by) continue;
		const x = ax + ((y - ay) * (bx - ax)) / (by - ay);
		lo = Math.min(lo, x);
		hi = Math.max(hi, x);
	}
	return lo <= hi ? [lo, hi] : undefined;
}

/** Collapses a row of cells into runs of one tone; `to` is inclusive. */
function toRuns(row: Int8Array): Run[] {
	const runs: Run[] = [];
	for (let i = 0; i < row.length; i++) {
		const last = runs.at(-1);
		if (last?.tone === row[i]) last.to = i;
		else runs.push({ tone: row[i], from: i, to: i });
	}
	return runs;
}

/** Folds slivers into the run before them so tone changes read as deliberate steps. */
function absorbShort(runs: Run[], min: number): Run[] {
	const out: Run[] = [];
	for (const run of runs) {
		const last = out.at(-1);
		const short = run.to - run.from + 1 < min;
		if (last && short && last.tone !== EMPTY) {
			last.to = run.to;
		} else if (last && last.tone === run.tone) {
			last.to = run.to;
		} else {
			out.push({ ...run });
		}
	}
	return out;
}
