import { describe, expect, it } from 'vite-plus/test';
import {
	diagonal,
	fit,
	mul,
	pow,
	project,
	quinticMesh,
	quinticPoint,
	realPlane,
	type Complex,
	type View
} from '#lib/logo/quintic.ts';
import { BOX, fine } from '#lib/logo/screen.ts';
import { lineScreen } from './screen.ts';
import { bounds, silhouette } from './silhouette.ts';

const add = ([a, b]: Complex, [c, d]: Complex): Complex => [a + c, b + d];
/** The mark's mesh seen from `view`, fitted to its box. */
const seen = (view: View) => {
	const mesh = quinticMesh({ nx: 12, ny: 12 });
	return project(mesh, view, fit(mesh, view, BOX));
};

describe('quinticPoint', () => {
	it('lies on z₁⁵ + z₂⁵ = 1 for every patch', () => {
		for (let k1 = 0; k1 < 5; k1++) {
			for (let k2 = 0; k2 < 5; k2++) {
				for (const [x, y] of [
					[0.2, -0.7],
					[0.9, 0.1],
					[1.4, 0.95]
				]) {
					const [z1, z2] = quinticPoint(k1, k2, x, y);
					const [re, im] = add(pow(z1, 5), pow(z2, 5));
					expect(re).toBeCloseTo(1, 9);
					expect(im).toBeCloseTo(0, 9);
				}
			}
		}
	});

	it('multiplies complex numbers', () => {
		expect(mul([0, 1], [0, 1])).toEqual([-1, 0]);
	});
});

describe('silhouette', () => {
	const mesh = quinticMesh({ nx: 24, ny: 24 });
	const faces = project(mesh, realPlane, fit(mesh, realPlane, 160, 6));
	const rings = silhouette(faces.map((face) => face.points));

	it('reduces the real-plane view to one outline and four apertures', () => {
		expect(rings).toHaveLength(5);
	});

	it('stays inside the padded frame', () => {
		const [minX, minY, maxX, maxY] = bounds(rings);
		expect(minX).toBeGreaterThanOrEqual(5);
		expect(minY).toBeGreaterThanOrEqual(5);
		expect(maxX).toBeLessThanOrEqual(155);
		expect(maxY).toBeLessThanOrEqual(155);
	});

	it('is mirror-symmetric about the vertical axis', () => {
		const [minX, , maxX] = bounds(rings);
		const mid = (minX + maxX) / 2;
		expect(Math.abs(mid - 80)).toBeLessThan(1.5);
	});
});

describe('project', () => {
	const faces = seen(diagonal);

	it('lights every face between 0 and 1', () => {
		for (const { light } of faces) {
			expect(light).toBeGreaterThanOrEqual(0);
			expect(light).toBeLessThanOrEqual(1);
		}
	});
});

describe('lineScreen', () => {
	const faces = seen(diagonal);
	const outline = silhouette(
		faces.map((face) => face.points),
		{ tolerance: 0.3, minArea: 1 }
	);
	const { pitch, weights } = fine;
	const bars = lineScreen(faces, outline, fine);

	it('engraves the surface as bars', () => {
		expect(bars.length).toBeGreaterThan(40);
	});

	it('never draws a bar thicker than the darkest weight', () => {
		for (const bar of bars) {
			const [, minY, , maxY] = bounds([bar]);
			expect(maxY - minY).toBeLessThanOrEqual(weights[0] * pitch + 0.02);
		}
	});

	it('stays inside the outline', () => {
		const [minX, minY, maxX, maxY] = bounds(outline);
		const [x0, y0, x1, y1] = bounds(bars);
		expect(x0).toBeGreaterThanOrEqual(minX - 0.01);
		expect(y0).toBeGreaterThanOrEqual(minY - 0.01);
		expect(x1).toBeLessThanOrEqual(maxX + 0.01);
		expect(y1).toBeLessThanOrEqual(maxY + 0.01);
	});

	it('lands every bar edge on a whole pixel when given a top', () => {
		const px = BOX / 32;
		const rings = lineScreen(
			faces,
			outline,
			{ pitch: 3 * px, minRun: 4 * px, weights: [1, 2 / 3, 1 / 3] },
			{ top: 0 }
		);
		for (const ring of rings) {
			for (const [i, [, y]] of ring.entries()) {
				const [, next] = ring[(i + 1) % ring.length];
				if (y === next) expect(Math.abs(y / px - Math.round(y / px))).toBeLessThan(0.01);
			}
		}
	});
});
