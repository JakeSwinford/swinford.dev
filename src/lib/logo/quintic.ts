// Hanson's parametrization of the Calabi–Yau quintic cross-section z₁⁵ + z₂⁵ = 1.
// Each of the n² patches (k₁, k₂) maps z = x + iy, x ∈ [0, π/2], to
//   z₁ = e^{2πik₁/n} · cos(z)^{2/n},  z₂ = e^{2πik₂/n} · sin(z)^{2/n}.

export type Complex = [re: number, im: number];
export type Vec3 = [x: number, y: number, z: number];
export type Point = [x: number, y: number];

export interface MeshOptions {
	/** Degree of the surface. */
	n?: number;
	/** Angle used to fold Im z₁ and Im z₂ into the third axis. */
	alpha?: number;
	/** Grid resolution per patch along x and y. */
	nx?: number;
	ny?: number;
	/** Half-extent of the patch in the imaginary direction. */
	ymax?: number;
}

export interface View {
	yaw: number;
	pitch: number;
	roll: number;
}

/** Maps a view onto the page: page = offset + view · scale. */
export interface Frame {
	scale: number;
	x: number;
	y: number;
}

export interface Face {
	/** Projected corners. */
	points: Point[];
	/** Mean distance toward the viewer; larger is nearer. */
	depth: number;
	/** How squarely the face catches the light, from 0 (edge-on) to 1. */
	light: number;
}

/** Key light from the upper left, slightly in front. */
export const LIGHT: Vec3 = [-0.4, -0.6, 0.7];

/** Looking straight down the real plane (Re z₁, Re z₂), turned 45°. */
export const realPlane: View = { yaw: 0, pitch: 0, roll: Math.PI / 4 };
/** The classic three-quarter view of the surface. */
export const diagonal: View = { yaw: -0.785, pitch: 0.615, roll: 0 };

export function mul([a, b]: Complex, [c, d]: Complex): Complex {
	return [a * c - b * d, a * d + b * c];
}

export function pow([re, im]: Complex, p: number): Complex {
	const r = Math.hypot(re, im);
	if (r === 0) return [0, 0];
	const t = Math.atan2(im, re);
	const rp = r ** p;
	return [rp * Math.cos(p * t), rp * Math.sin(p * t)];
}

const cis = (t: number): Complex => [Math.cos(t), Math.sin(t)];

/** The point (z₁, z₂) of patch (k₁, k₂) at parameter z = x + iy. */
export function quinticPoint(
	k1: number,
	k2: number,
	x: number,
	y: number,
	n = 5
): [Complex, Complex] {
	const cosZ: Complex = [Math.cos(x) * Math.cosh(y), -Math.sin(x) * Math.sinh(y)];
	const sinZ: Complex = [Math.sin(x) * Math.cosh(y), Math.cos(x) * Math.sinh(y)];
	const z1 = mul(cis((2 * Math.PI * k1) / n), pow(cosZ, 2 / n));
	const z2 = mul(cis((2 * Math.PI * k2) / n), pow(sinZ, 2 / n));
	return [z1, z2];
}

/** Every patch of the surface as quads embedded in 3D. */
export function quinticMesh({
	n = 5,
	alpha = Math.PI / 4,
	nx = 12,
	ny = 12,
	ymax = 1
}: MeshOptions = {}): Vec3[][] {
	const quads: Vec3[][] = [];
	for (let k1 = 0; k1 < n; k1++) {
		for (let k2 = 0; k2 < n; k2++) {
			const grid: Vec3[][] = [];
			for (let i = 0; i <= nx; i++) {
				grid[i] = [];
				for (let j = 0; j <= ny; j++) {
					const [z1, z2] = quinticPoint(
						k1,
						k2,
						(Math.PI / 2) * (i / nx),
						-ymax + (2 * ymax * j) / ny,
						n
					);
					grid[i][j] = [z1[0], z2[0], Math.cos(alpha) * z1[1] + Math.sin(alpha) * z2[1]];
				}
			}
			for (let i = 0; i < nx; i++) {
				for (let j = 0; j < ny; j++) {
					quads.push([grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]);
				}
			}
		}
	}
	return quads;
}

export function rotate([x, y, z]: Vec3, { yaw, pitch, roll }: View): Vec3 {
	[x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
	[y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
	[x, y] = [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll)];
	return [x, y, z];
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0]
];
const unit = (v: Vec3): Vec3 => {
	const length = Math.hypot(...v) || 1;
	return [v[0] / length, v[1] / length, v[2] / length];
};

/** The frame that fits `quads`, seen from `view`, centered in a `size`² box with `pad` margin. */
export function fit(quads: Vec3[][], view: View, size: number, pad = 0): Frame {
	let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
	for (const quad of quads) {
		for (const p of quad) {
			const [x, y] = rotate(p, view);
			[minX, minY, maxX, maxY] = [
				Math.min(minX, x),
				Math.min(minY, y),
				Math.max(maxX, x),
				Math.max(maxY, y)
			];
		}
	}
	const scale = (size - 2 * pad) / Math.max(maxX - minX, maxY - minY);
	return {
		scale,
		x: size / 2 - ((minX + maxX) / 2) * scale,
		y: size / 2 - ((minY + maxY) / 2) * scale
	};
}

/** Orthographic projection of every quad through `frame`, shaded by its angle to `light`. */
export function project(quads: Vec3[][], view: View, frame: Frame, light = LIGHT): Face[] {
	const toLight = unit(light);
	return quads.map((quad) => {
		const rotated = quad.map((p) => rotate(p, view));
		const normal = unit(cross(sub(rotated[2], rotated[0]), sub(rotated[3], rotated[1])));
		return {
			points: rotated.map(([x, y]): Point => [
				frame.x + x * frame.scale,
				frame.y + y * frame.scale
			]),
			depth: rotated.reduce((sum, [, , z]) => sum + z, 0) / rotated.length,
			light: Math.abs(normal[0] * toLight[0] + normal[1] * toLight[1] + normal[2] * toLight[2])
		};
	});
}
