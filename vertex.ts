import { base_id, VertexArgs } from "./enums.js";

/**
 * represents a "to" vertex that is linked by an edge of weight weight accessible from a "from" Vertex.
 */
export type VertexNeighbor = {
	// from is known !
	to: Vertex;
	weight: number;
};

export class Vertex {
	readonly id: base_id;
	weight: number;

	/**
	 * Vertex constructor
	 * @param  {VertexArgs} args
	 */
	constructor(args: VertexArgs) {
		this.id = args.id;
		this.weight = args.weight ?? 1;
	}

	toString(): string {
		return `V(${this.id})-w=${this.weight}`;
	}
}
