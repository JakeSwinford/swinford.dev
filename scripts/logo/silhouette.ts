import ClipperLib, { type Path, type Paths } from 'clipper-lib';
import type { Point } from '#lib/logo/quintic.ts';

const { Clipper, ClipperOffset, PolyType, ClipType, PolyFillType, JoinType, EndType } = ClipperLib;

export interface SilhouetteOptions {
	/** Fixed-point scale for Clipper's integer coordinates. */
	scale?: number;
	/** Grow-then-shrink distance that seals hairline cracks between patches. */
	seal?: number;
	/** Douglas–Peucker tolerance: higher means fewer, straighter facets. */
	tolerance?: number;
	/** Rings smaller than this area are dropped. */
	minArea?: number;
}

/** Union projected faces into the filled outline of the surface: one outer ring plus its holes. */
export function silhouette(
	faces: Point[][],
	{ scale = 100, seal = 0.5, tolerance = 2.2, minArea = 4 }: SilhouetteOptions = {}
): Point[][] {
	const clipper = new Clipper();
	for (const face of faces) {
		const q = face.map(([x, y]) => ({ X: Math.round(x * scale), Y: Math.round(y * scale) }));
		// Split into triangles and wind each the same way so overlapping faces add under
		// non-zero filling instead of cancelling into false holes.
		for (const tri of [
			[q[0], q[1], q[2]],
			[q[0], q[2], q[3]]
		]) {
			if (!Clipper.Orientation(tri)) tri.reverse();
			clipper.AddPath(tri, PolyType.ptSubject, true);
		}
	}
	let rings: Paths = [];
	clipper.Execute(ClipType.ctUnion, rings, PolyFillType.pftNonZero, PolyFillType.pftNonZero);
	rings = offset(offset(rings, seal * scale), -seal * scale);
	rings = Clipper.CleanPolygons(rings, 0.2 * scale)
		.map((ring) => simplify([...ring, ring[0]], tolerance * scale).slice(0, -1))
		.filter((ring) => ring.length > 2 && Math.abs(Clipper.Area(ring)) > minArea * scale * scale);
	return rings.map((ring) => ring.map(({ X, Y }): Point => [X / scale, Y / scale]));
}

function offset(rings: Paths, delta: number): Paths {
	const co = new ClipperOffset();
	co.AddPaths(rings, JoinType.jtMiter, EndType.etClosedPolygon);
	const out: Paths = [];
	co.Execute(out, delta);
	return out;
}

/** Douglas–Peucker on an open polyline. */
function simplify(points: Path, epsilon: number): Path {
	if (points.length < 3) return points;
	const a = points[0];
	const b = points[points.length - 1];
	const dx = b.X - a.X;
	const dy = b.Y - a.Y;
	const length = Math.hypot(dx, dy);
	let max = 0;
	let at = 0;
	for (let i = 1; i < points.length - 1; i++) {
		const p = points[i];
		const d =
			length === 0
				? Math.hypot(p.X - a.X, p.Y - a.Y)
				: Math.abs(dy * p.X - dx * p.Y + b.X * a.Y - b.Y * a.X) / length;
		if (d > max) [max, at] = [d, i];
	}
	if (max <= epsilon) return [a, b];
	return [
		...simplify(points.slice(0, at + 1), epsilon).slice(0, -1),
		...simplify(points.slice(at), epsilon)
	];
}

export function bounds(rings: Point[][]): [minX: number, minY: number, maxX: number, maxY: number] {
	const xs = rings.flat().map(([x]) => x);
	const ys = rings.flat().map(([, y]) => y);
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** SVG path data for closed rings, using H/V for axis-aligned edges and no redundant zeros. */
export function toPathData(rings: Point[][], digits = 1): string {
	const fmt = (v: number) => String(Number(v.toFixed(digits)));
	return rings
		.map((ring) => {
			const pts = ring.map(([x, y]) => [fmt(x), fmt(y)]);
			let d = `M${pts[0][0]} ${pts[0][1]}`;
			for (let i = 1; i < pts.length; i++) {
				const [[px, py], [x, y]] = [pts[i - 1], pts[i]];
				if (y === py) d += `H${x}`;
				else if (x === px) d += `V${y}`;
				else d += `L${x} ${y}`;
			}
			return `${d}Z`;
		})
		.join('')
		.replace(/(\d) -/g, '$1-');
}
