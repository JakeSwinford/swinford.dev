import ClipperLib, { type Path } from 'clipper-lib';
import type { Face, Point } from '#lib/logo/quintic.ts';
import { bars, grid, type ScreenOptions } from '#lib/logo/screen.ts';

const { Clipper, PolyType, ClipType, PolyFillType } = ClipperLib;

export interface LineScreenOptions {
	/**
	 * Lays the stripes in cells one pitch tall from here down, each bar hanging from the top of its
	 * cell, so a raster with a whole number of pixels to the pitch draws every edge crisp.
	 */
	top?: number;
	/** Fixed-point scale for Clipper's integer coordinates. */
	scale?: number;
}

/** The line screen as closed rings: every bar, clipped to `outline` so its ends follow the edge. */
export function lineScreen(
	faces: Face[],
	outline: Point[][],
	options: ScreenOptions,
	{ top, scale = 100 }: LineScreenOptions = {}
): Point[][] {
	const { pitch } = options;
	const lines = grid(faces, pitch, top === undefined ? undefined : top + pitch / 2);
	const clipper = new Clipper();
	for (const { left, right, y, thickness } of bars(faces, lines, options)) {
		const upper = top === undefined ? y - thickness / 2 : y - pitch / 2;
		const lower = upper + thickness;
		const bar: Point[] = [
			[left, upper],
			[right, upper],
			[right, lower],
			[left, lower]
		];
		clipper.AddPath(toClipper(bar, scale), PolyType.ptSubject, true);
	}
	for (const ring of outline) clipper.AddPath(toClipper(ring, scale), PolyType.ptClip, true);

	const solution: Path[] = [];
	clipper.Execute(
		ClipType.ctIntersection,
		solution,
		PolyFillType.pftNonZero,
		PolyFillType.pftEvenOdd
	);
	return Clipper.CleanPolygons(solution, 0.05 * scale)
		.filter((ring) => ring.length > 2)
		.map((ring) => ring.map(({ X, Y }): Point => [X / scale, Y / scale]));
}

const toClipper = (ring: Point[], scale: number): Path =>
	ring.map(([x, y]) => ({ X: Math.round(x * scale), Y: Math.round(y * scale) }));
