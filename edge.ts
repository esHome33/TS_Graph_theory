import { base_id, EdgeArgs } from "./enums.js";

/**
 * Classe qui représente un arc entre deux noeuds. L'arc est dirigé
 * et comporte un poids (valeur 1 par défaut)
 */
export class Edge {
	private from: base_id;
	private to: base_id;
	weight: number;

	/**
	 * Create an edge between `from` and `to`.
	 *
	 * Weight is set to 1 by default (i.e. unweighted).
	 * @param  {EdgeArgs} args
	 */
	constructor(args: EdgeArgs) {
		this.from = args.from;
		this.to = args.to;
		this.weight = args.weight ?? 1;
	}

	/**
	 * Returns an object with the two vertices in the egde.
	 * @returns {{ from:base_id, to:base_id }}
	 */
	get vertices(): { from: base_id; to: base_id } {
		return { from: this.from, to: this.to };
	}

	/**
	 * returns an objet with the two vertices in this edge and the weight
	 */
	get args(): EdgeArgs {
		return { from: this.from, to: this.to, weight: this.weight };
	}


	toString(): string {
		return `${this.from} -> ${this.to.toString()} W:${this.weight}`;
	}

	/**
	 * compares the two vertices of this edge and the given edge
	 * @param edge another edge to compare to this edge
	 * @param is_directed defaults to false
	 * @returns true or false
	 */
	isSameAs(edge: Edge, is_directed = false): boolean {
		const { vertices } = this;
		return (
			(edge.vertices.from === vertices.from &&
				edge.vertices.to === vertices.to) ||
			(!is_directed &&
				edge.vertices.from === vertices.to &&
				edge.vertices.to === vertices.from)
		);
	}

	/**
	 * dans cet arc, cherche le noeud opposé à l'id fourni (s'il se trouve dans cet arc !
	 * fournit ```undefined``` sinon).
	 * @param vertex_id l'identifiant cherché
	 * @returns un noeud. Le noeud opposé à l'id fourni (s'il y est) ou ```undefined```
	 */
	pairVertex(vertex_id: base_id): base_id | undefined {
		if (vertex_id === this.to) return this.from;
		else if (vertex_id === this.from) return this.to;
		return undefined;
	}

	/**
	 * Vérifie si l'identifiant est contenu dans cet arc.
	 * @param vertex_id l'identifiant recherché
	 * @returns vrai si le noeud de départ ou le noeud d'arrivée porte l'identifiant fourni
	 */
	hasVertex(vertex_id: base_id): boolean {
		if (this.from === vertex_id || this.to === vertex_id) return true;
		return false;
	}
}
