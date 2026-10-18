declare module 'clipper-lib' {
	export interface IntPoint {
		X: number;
		Y: number;
	}
	export type Path = IntPoint[];
	export type Paths = Path[];

	export class Clipper {
		AddPath(path: Path, polyType: number, closed: boolean): boolean;
		Execute(clipType: number, solution: Paths, subjFillType: number, clipFillType: number): boolean;
		static Orientation(path: Path): boolean;
		static Area(path: Path): number;
		static CleanPolygons(paths: Paths, distance: number): Paths;
	}
	export class ClipperOffset {
		AddPaths(paths: Paths, joinType: number, endType: number): void;
		Execute(solution: Paths, delta: number): void;
	}
	export const PolyType: { ptSubject: number; ptClip: number };
	export const ClipType: { ctUnion: number; ctIntersection: number };
	export const PolyFillType: { pftNonZero: number; pftEvenOdd: number };
	export const JoinType: { jtMiter: number };
	export const EndType: { etClosedPolygon: number };

	const ClipperLib: {
		Clipper: typeof Clipper;
		ClipperOffset: typeof ClipperOffset;
		PolyType: typeof PolyType;
		ClipType: typeof ClipType;
		PolyFillType: typeof PolyFillType;
		JoinType: typeof JoinType;
		EndType: typeof EndType;
	};
	export default ClipperLib;
}
