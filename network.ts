import { Vertex, VertexNeighbor } from "./vertex.js";
import { Edge } from "./edge.js";
import {
	base_id,
	VertexArgs,
	EdgeArgs,
	NetworkArgs,
	ERROR,
	EdgeNeighborhood,
} from "./enums.js";
import { MinHeap } from "@datastructures-js/heap";

/**
 * What ```dijkstra()``` method in {@link Network} returns.
 */
export type DijkstraResult = {
	/**
	 *  An array of each vertex in the Network and his best predecessor and
	 *  the distance to go to each of these vertices form the start vertex.
	 */
	predecessors: string[];
	/**
	 * the path to go from the start to the end vertex
	 */
	path: string;
};

/**
 * Network stores a Graph, with Edges, Vertices, weights for them and orientation.
 *
 * A good number of methods and properties are available.
 */
export default class Network {
	/**
	 * la liste des arcs de ce graphe
	 */
	readonly edges: Map<base_id, Edge>;
	/**
	 * La liste des noeuds dans ce graphe
	 */
	readonly vertices: Map<base_id, Vertex>;

	readonly is_directed: boolean;
	readonly is_multigraph: boolean;

	//readonly [key: string]: any;

	private edge_limit: number;
	private vertex_limit: number;
	private free_eid: number;
	private free_vid: number;

	/**
	 *  Construct a new Network.
	 *
	 * 	By default, it will be not directed, not a multigraph (multiple
	 *  different edges between two same vertices),
	 *  and with 1500 vertices max and 2500 edges max.
	 */
	constructor(args: NetworkArgs = {}) {
		this.edges = new Map();
		this.vertices = new Map();
		this.is_directed = args.is_directed ?? false;
		this.vertex_limit = args.vertex_limit ?? 1500;
		this.edge_limit = args.edge_limit ?? 2500;
		this.free_eid = 0;
		this.free_vid = 0;
		this.is_multigraph = false;
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	//// START ETIENNE DIJKSTRA    /////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * liste des noeuds prédécesseurs indexée par les id des noeuds : this list is filled
	 * when executing ```this.dijkstra(start, end)```
	 */
	predecessor: { [id: base_id]: Vertex | null } = {};

	/**
	 * Dijkstra shortest path implementation for a Network.
	 *
	 * This implementation uses a MinHeap (from "@datastructures-js/heap") to store all
	 * the best weighed vertices.
	 *
	 * @param start id of departure node
	 * @param end id of arrival node
	 * @returns a list of all nodes in the graph and their best predecessor + the path from start to end
	 */
	dijkstra = (start: base_id, end: base_id): DijkstraResult => {
		// erase the precedent list of predecessors.
		this.predecessor = {};
		// check if all is OK with the nodes id's
		const s_ok = this.hasVertex(start);
		const e_ok = this.hasVertex(end);
		if (!(s_ok && e_ok)) {
			if (!s_ok) {
				throw {
					message: `${ERROR.INEXISTENT_START_VERTICE} in dijkstra() - ${start}`,
				};
			}
			if (!e_ok) {
				throw {
					message: `${ERROR.INEXISTENT_END_VERTICE} in dijkstra() - ${end}`,
				};
			}
		}
		// initialisation of all nodes in the Network
		this.value_a_infini(this.vertices);

		const start_vertex: Vertex | undefined = this.vertices.get(start);
		/// normally, this cannot happen here (already checked before)
		if (!start_vertex) {
			return {
				predecessors: [
					`${ERROR.INEXISTENT_START_VERTICE} in dijkstra() - ${start}`,
				],
				path: "ERROR path not available in dijsktra()",
			};
		}
		start_vertex.weight = 0;

		// use MinHeap to store already accessed Nodes ordered by their weight
		const queue: MinHeap<Vertex> = new MinHeap<Vertex>((x) => x.weight);
		queue.insert(start_vertex);
		// init predecessors of the start node and put the start node in the visited_vertices list.
		this.predecessor[start_vertex.id] = null;

		let finish = false;
		let counter = 0;

		// main Dijkstra iteration
		while (queue.size() > 0 && !finish) {
			counter++;
			const current_vertex: Vertex | null = queue.pop();
			if (!current_vertex) {
				break;
			}
			const voisins = this.edge_neighbors(
				current_vertex.id,
				!this.is_directed
			);
			for (let voisin of voisins) {
				// on parcourt tous les voisins du noeud courant (current_vertex)
				counter++;
				const update_done = this.update_distances(
					current_vertex,
					voisin.to,
					voisin.weight,
					this.predecessor
				);
				if (update_done) {
					queue.push(voisin.to); /// inclut le voisin dans la liste triée selon le poids.
				}
				/* uncomment this if you want to finish as soon as the end vertex is found
				if (voisin.to.id === end) {
					finish = true;
					break;
				}
				*/
			}
		}
		const resu = this.getPredecesseurs(this.predecessor);
		const chemin = this.analysePredecesseurs(this.predecessor, end);
		return { predecessors: resu, path: chemin };
	};

	/**
	 * Analyse la liste des prédecesseurs construite lors de l'algo de Dijkstra et
	 * fournit une liste des antécédents de chaque noeud
	 * @param pred un objet indexé par les l'id et qui donne le prédécesseur de cet id ainsi
	 * que le poids total depuis le noeud de départ (celui sans prédécesseur)
	 * @returns un tableau comportant le nom du noeud et de son prédécesseur ainsi que le poids total.
	 */
	private getPredecesseurs = (pred: {
		[id: base_id]: Vertex | null;
	}): string[] => {
		let resu: string[] = [];

		for (let p of this.vertices) {
			const idx: base_id = p[0];
			const v: Vertex | null = pred[idx];
			if (v === null) {
				resu.push(`${idx} START`);
			} else {
				const e: Edge | undefined = this.edgeBetween(idx, v.id);
				if (e) {
					const e_weight = e.weight;
					resu.push(`${idx} <- ${v.id} (${v.weight + e_weight})`);
				}
			}
		}
		return resu;
	};

	/**
	 * Fournit le chemin menant du départ à l'arrivée suite à l'application de la
	 * fonction ```this Network.dijkstra()```
	 *
	 * @param pred les prédécesseurs issus de l'algo de Dijkstra
	 * @param noeud_arrivee le noeud d'arrivé dont on souhaite connaitre le chemin optimal issu du noeud de départ
	 * @returns une chaine donnant la succession des noeuds depuis le départ jusqu'à l'arrivée et les poids associés.
	 * @throws ERROR dans le cas où le noeud d'arrivée fourni ne se trouve pas dans le Network.
	 */
	analysePredecesseurs = (
		pred: { [id: base_id]: Vertex | null },
		noeud_arrivee: base_id
	): string => {
		if (!this.hasVertex(noeud_arrivee)) {
			throw ERROR.INEXISTENT_VERTICE;
		}

		let noeud_courant: base_id = noeud_arrivee;
		let noeud_precedent: Vertex | null;
		let resu: string = "";
		do {
			noeud_precedent = pred[noeud_courant];

			if (noeud_precedent !== null) {
				// on change pour la boucle suivant
				const e: Edge | undefined = this.edgeBetween(
					noeud_precedent.id,
					noeud_courant
				);
				let e_weight: number = 0;
				if (e) {
					e_weight = e.weight;
				}
				let tmp = ` - ${noeud_courant} (${
					e_weight + noeud_precedent.weight
				})`;
				resu = tmp + resu;
				noeud_courant = noeud_precedent.id;
			} else {
				let tmp = `${noeud_courant}`;
				resu = tmp + resu;
			}
		} while (noeud_precedent !== null);
		return resu;
	};

	/**
	 * effectue la prise en compte de la distance la plus courte pour un noeud v2 voisin de v1.
	 * @param v1 noeud de départ
	 * @param v2 noeud voisin du noeud de départ
	 * @param d_v1_to_v2 poids de l'arc entre v1 et v2
	 * @param predecessor liste des prédécesseurs
	 * @returns VRAI si on a trouvé un plus court et du coup l'appelant devrait enregistré v2
	 * comme visité // ou FAUX si rien n'a été fait
	 */
	private update_distances = (
		v1: Vertex,
		v2: Vertex,
		d_v1_to_v2: number,
		predecessor: { [id: string]: Vertex | null; [id: number]: Vertex | null }
	) => {
		let poids1: number = v1.weight;
		let poids2: number = v2.weight;

		if (poids2 > poids1 + d_v1_to_v2) {
			// mise à jour du poids de v2 et enregistrement du prédécesseur
			v2.weight = poids1 + d_v1_to_v2;
			predecessor[v2.id] = v1;
			return true;
		} else {
			// on ne fait rien.
			return false;
		}
	};

	/**
	 * Initialise les étiquettes ou les poids des noeuds à la valeur infinie.
	 * Utilisé dans l'algorithme de Dijkstra.
	 *
	 * @param vertices les noeuds à initialiser à la valeur infinie ```Number.MAX_VALUE```
	 */
	private value_a_infini(vertices: Map<base_id, Vertex>) {
		for (let v of vertices) {
			const vertex_to_change = v[1];
			vertex_to_change.weight = Number.MAX_VALUE;
		}
	}

	/**
	 * get vital information about this Network and prints all vertices id.
	 */
	get net_informations(): string {
		let resu: string = "";
		resu += `${this.vertices.size} vertices - ${this.edges.size} edges - is_directed = ${this.is_directed}`;
		for (let vertex of this.vertices) {
			resu += `${vertex[1].id} `;
		}
		return resu;
	}

	//////////// caching neighbor list in order to increase speed when a Network is no more changed //////

	//NOTE: ajout pour vertices neighbor cache for Dijkstra
	/**
	 * true if {@link constructNeighborsCache()} was called.
	 * false when a new edge or new vertex is created
	 * @author ESHome33 - 2024
	 */
	private _neighbors_cached = false;

	/**
	 *  A cache that stores, for each given vertex in the Network an array of
	 * 		- neighbor vertex id (a vertex that is linked to the given vertex)
	 * 		- the weight of the edge linking the two edges
	 * @author ESHome33 - 2024
	 */
	private _neighbors: { [id: base_id]: VertexNeighbor[] } = {};

	/**
	 * Method that stores in the {@link _neighbors} cache all neighbors for all vertices
	 * @author ESHome33 - 2024
	 */
	private constructNeighborsCache(oriented: boolean) {
		// search all neighbors for all vertices
		// construct neighbor cache
		for (let current_v of this.vertices) {
			// search all vertices that are connected with current_v
			const neighborhood: VertexNeighbor[] = [];
			this.edges.forEach((e: Edge) => {
				const w = e.weight;
				const from_index = e.vertices.from;
				const to_index = e.vertices.to;
				if (from_index === current_v[1].id) {
					const v = this.vertices.get(to_index);
					if (v) {
						neighborhood.push({ to: v, weight: w });
					}
				}
				if (to_index === current_v[1].id && oriented) {
					const v = this.vertices.get(from_index);
					if (v) {
						neighborhood.push({ to: v, weight: w });
					}
				}
			});
			this._neighbors[current_v[1].id] = neighborhood;
			// the cache is now up to date
			this._neighbors_cached = true;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	//// END ETIENNE DIJKSTRA    ///////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Les arguments qui ont été fournis lors de l'instantiation de ce Network
	 */
	get args(): NetworkArgs {
		return {
			is_directed: this.is_directed,
			is_multigraph: this.is_multigraph,
			edge_limit: this.edge_limit,
			vertex_limit: this.vertex_limit,
		};
	}

	/**
	 * Get network's vertex weight.
	 *
	 * A network's vertex weight is the sum of all its vertices' weights
	 * @returns number
	 */
	get vertex_weight(): number {
		return this.vertex_list
			.map((vertex) => vertex.weight)
			.reduce((prev, curr) => prev + curr);
	}

	/**
	 * Get network's weight.
	 *
	 * A network's weight is the sum of all its edges' weights
	 * @returns number
	 */
	get weight(): number {
		return this.edge_list
			.map((edge) => edge.weight)
			.reduce((prev, curr) => prev + curr);
	}

	/**
	 * A network's product is the product of all its edges weights
	 * @returns number
	 */
	get product(): number {
		return this.edge_list
			.map((e) => e.weight)
			.reduce((weight1, weight2) => weight1 * weight2);
	}

	/**
	 * List of vertices with negative weight.
	 * @returns Vertex[]
	 */
	get negative_vertices(): Vertex[] {
		const { vertex_list } = this;
		return vertex_list.filter((vertex) => vertex.weight < 0);
	}

	/**
	 * List of vertices with positive weight.
	 * @returns Vertex[]
	 */
	get positive_vertices(): Vertex[] {
		const { vertex_list } = this;
		return vertex_list.filter((vertex) => vertex.weight > 0);
	}

	/**
	 * List of edges with negative weight.
	 * @returns Edge[]
	 */
	get negative_edges(): Edge[] {
		const { edge_list } = this;
		return edge_list.filter((edge) => edge.weight < 0);
	}

	/**
	 * List of edges with positive weight.
	 * @returns Edge[]
	 */
	get positive_edges(): Edge[] {
		const { edge_list } = this;
		return edge_list.filter((edge) => edge.weight > 0);
	}

	/**
	 * List of vertices with zero weight.
	 * @returns Vertex[]
	 */
	get zero_vertices(): Vertex[] {
		const { vertex_list } = this;
		return vertex_list.filter((vertex) => vertex.weight == 0);
	}

	/**
	 * Get network's [genus](https://en.wikipedia.org/wiki/Genus_%28mathematics%29).
	 * @returns number
	 */
	get genus(): number {
		return this.edges.size - this.vertices.size + 1;
	}

	/**
	 * Get the values of the vertices.
	 * @returns base_id[]
	 */
	get vertex_list(): Vertex[] {
		const resu: Vertex[] = [];
		const v = this.vertices.values();
		for (const val of v) {
			resu.push(val);
		}
		return resu;
	}

	/**
	 * Get an array with the edges of the network
	 * @returns Edge[]
	 */
	get edge_list(): Edge[] {
		const resu: Edge[] = [];
		const v = this.edges.values();
		for (const val of v) {
			resu.push(val);
		}
		return resu;
	}

	/**
	 * Returns pairs of nodes that represent `from` and `to` (respectively) vertices in an edge
	 * @returns [base_id, base_id][]
	 */
	get simple_edge_list(): [base_id, base_id][] {
		return this.edge_list.map(({ vertices }) => [vertices.from, vertices.to]);
	}

	/**
	 * Number of edges in the [maximum clique possible](https://www.wikiwand.com/en/Clique_(graph_theory))
	 * with the network's number of vertices.
	 * @returns number
	 */
	get max_edges(): number {
		return (this.vertices.size * (this.vertices.size - 1)) / 2;
	}

	/**
	 * Returns the network's [density](https://www.baeldung.com/cs/graph-density)
	 * @returns number
	 */
	get density(): number {
		return this.edges.size / this.max_edges;
	}

	/**
	 * Ranked neighborhood: list sorted by the number of neighbors by vertex
	 * @returns { vertex: base_id; neighbors: number }[]
	 */
	get ranked_neighborhood(): { vertex: base_id; neighbors: number }[] {
		return this.vertex_list
			.map((vertex) => {
				return {
					vertex: vertex.id,
					neighbors: this.neighbors(vertex.id).length,
				};
			})
			.sort((a, b) => (a.neighbors < b.neighbors ? 1 : -1));
	}

	/**
	 * returns the description of this Network in DOT language
	 *
	 * @author ESHome33 - 2024
	 */
	get dot_description(): string {
		let resu: string = "\n";
		const fleche: string = this.is_directed ? "->" : "--";
		for (const e of this.edge_list) {
			resu += `${e.vertices.from}${fleche}${e.vertices.to} [label=${e.weight}]\n`;
		}
		return resu;
	}

	/**
	 * Ajoute un arc entre les deux noeuds passés en argument
	 *
	 * Si do_force = false, il faut que les sommets existent dans Network
	 * pour que l'arc soit ajouté.
	 *
	 * @param  {EdgeArgs} args contient l'id des noeuds départ et arrivée,
	 * 	ainsi que optionnellement le poids. Ce poids est par défaut à ```1```
	 * 	do_force est par défaut à ```true```
	 *
	 * @returns ```true``` if edge was effectively added
	 *
	 * @throws Errors in some cases.
	 *
	 */
	addEdge(args: EdgeArgs): boolean {
		args.do_force ??= true;
		args.weight ??= 1;

		args.id ??= this.newEID();

		if (this.edges.has(args.id)) throw { message: ERROR.EXISTING_EDGE };

		if (args.from === args.to) throw { message: ERROR.SELF_LOOP, args };

		if (this.edges.size >= this.edge_limit)
			throw { message: ERROR.EDGE_LIMIT };

		// adding vertices (or throw error if do_force is false)
		if (!args.do_force) {
			if (!this.vertices.has(args.from))
				throw { message: ERROR.INEXISTENT_VERTICE, vertex: args.from };
			if (!this.vertices.has(args.to))
				throw { message: ERROR.INEXISTENT_VERTICE, vertex: args.to };
		} else {
			this._neighbors_cached = false; //NOTE: ajout pour neighbor cache
			if (!this.vertices.has(args.from)) this.addVertex({ id: args.from });
			if (!this.vertices.has(args.to)) this.addVertex({ id: args.to });
		}

		if (!this.is_multigraph && this.hasEdge(args.from, args.to)) return false;
		// throw { message: ERROR.NOT_MULTIGRAPH };

		this._neighbors_cached = false; //NOTE: ajout pour neighbor cache
		this.edges.set(args.id, new Edge(args));
		return true;
	}

	/**
	 * Add multiple edges from a map of edges.
	 * @param  {Map<base_id, Edge>} edge_map
	 * @throws Errors in some cases.
	 */
	addEdgeMap(edge_map: Map<base_id, Edge>) {
		edge_map.forEach((edge) => this.addEdge(edge.args));
	}

	/**
	 * Add multiple edges from a list.
	 *
	 * @param edge_list the list of two id's of vertex and the weight of the edge
	 * (if weight is omitted, the default weight of 1 is used)
	 * @throws Errors in some cases.
	 */
	addEdgeList(edge_list: [base_id, base_id, number?][]) {
		edge_list.forEach((edge) => {
			if (edge[2]) {
				this.addEdge({ from: edge[0], to: edge[1], weight: edge[2] });
			} else {
				this.addEdge({ from: edge[0], to: edge[1] });
			}
		});
	}

	/**
	 * Add multiple edges from a list of [base_id, base_id].
	 * @param  {EdgeArgs[]} edge_args
	 * @throws Errors in some cases.
	 */
	addEdgeListArgs(edge_args: EdgeArgs[]) {
		edge_args.forEach((edge) => this.addEdge(edge));
	}

	/**
	 * Removes an edge between the two given vertices.
	 *
	 * If the network is a multigraph, an ID is needed to remove a specific edge.
	 *
	 * @param  {Object} args
	 * @param  {base_id} args.from
	 * @param  {base_id} args.to
	 * @param  {base_id} [args.id]
	 */
	removeEdge(args: { from: base_id; to: base_id; id?: base_id }) {
		if (!args.id && this.is_multigraph) {
			return;
		}
		this.edges.forEach(({ vertices }, id) => {
			if (this.checkEdgeIsSame(vertices, args)) {
				this.edges.delete(id);
				//NOTE: added for vertex neighbor cache
				this._neighbors_cached = false;
				return;
			}
		});
	}

	/**
	 * Returns true if an edge (undirected) between from and to exists.
	 * @param  {base_id} from
	 * @param  {base_id} to
	 * @returns boolean
	 */
	hasEdge(from: base_id, to: base_id, is_directed = false): boolean {
		return this.edge_list.some(({ vertices }) =>
			this.checkEdgeIsSame(vertices, { from, to }, is_directed)
		);
	}

	/**
	 * Returns a list of edges between two given nodes.
	 *
	 * If the network is not a multigraph, the list will always be either empty or have only one item.
	 * @param  {base_id} from
	 * @param  {base_id} to
	 * @returns base_id[]
	 */
	getEdgesBetween(
		from: base_id,
		to: base_id,
		is_directed = this.is_directed
	): base_id[] | base_id {
		const edge_list: base_id[] = [];

		this.edges.forEach(({ vertices }, id) => {
			if (this.checkEdgeIsSame(vertices, { from, to }, is_directed)) {
				edge_list.push(id);
			}
		});

		return this.is_multigraph ? edge_list : edge_list[0];
	}

	/**
	 * Returns the edge between two nodes.
	 * @param  from start vertice
	 * @param  to arrival vertice
	 * @param  is_directed indicates if using directed edges or not
	 * (defaults to ```this Network.is_directed```)
	 * @returns an Edge or undefined
	 */
	edgeBetween(
		from: base_id | undefined,
		to: base_id | undefined,
		is_directed = this.is_directed
	): Edge | undefined {
		if (from === undefined || to === undefined) return undefined;
		return this.edge_list.find(({ vertices }) =>
			this.checkEdgeIsSame(vertices, { from, to }, is_directed)
		);
	}

	/**
	 * Add a vertex to this Network if it is not already in the Network.
	 *
	 * @param args id and optional weight of vertex
	 * @returns total of vertices in this Network
	 */
	addVertex(args: VertexArgs): number {
		if (this.vertices.size + 1 >= this.vertex_limit)
			throw { message: ERROR.VERTICE_LIMIT };
		if (args.id !== undefined && this.vertices.has(args.id))
			throw { message: ERROR.EXISTING_VERTICE };

		let res;
		if (args.id !== undefined) {
			//NOTE: added for vertex neighbor cache
			this._neighbors_cached = false;
			res = this.vertices.set(args.id, new Vertex(args));
		} else {
			res = this.vertices;
		}
		return res.size;
	}

	/**
	 * Add multiple vertices from a map of vertices.
	 *
	 * Be careful, if an added vertex already exist in Network,
	 * his weight will be updated with the given value.
	 *
	 * @param  {Map<base_id, Vertex>} vertex_map list of vertices to add to this Network
	 * @returns how many vertices were effectively added
	 *
	 */
	addVertexMap(vertex_map: Map<base_id, Vertex>): number {
		const how_many_to_add = vertex_map.size;
		if (this.vertices.size + how_many_to_add >= this.vertex_limit)
			throw { message: ERROR.VERTICE_LIMIT };

		let added = 0;
		vertex_map.forEach((vertex, id) => {
			if (vertex.id !== undefined) {
				added++;
				this.vertices.set(id, vertex);
			}
		});
		return added;
	}

	/**
	 * Add multiple vertices from a list of VertexArgs.
	 *
	 * Be careful, if an added vertex already exist in this Network,
	 * his weight will be updated with the given value.
	 *
	 * @param vertex_list a list of vertices to add to this Network
	 * @returns how many vertices were effectively added
	 */
	addVertexList(vertex_list: VertexArgs[]): number {
		const how_many_to_add = vertex_list.length;
		if (this.vertices.size + how_many_to_add >= this.vertex_limit)
			throw { message: ERROR.VERTICE_LIMIT };

		let added = 0;
		vertex_list.forEach((vertex_args, id) => {
			if (vertex_args.id != undefined) {
				added++;
				this.vertices.set(id, new Vertex(vertex_args));
			}
		});
		return added;
	}

	/**
	 * Removes vertex with given id.
	 * @param  {base_id} id
	 */
	removeVertex(id: base_id) {
		if (!this.vertices.has(id))
			throw { message: ERROR.INEXISTENT_VERTICE, vertex: id };

		//NOTE: ajout pour neighbor caching
		this._neighbors_cached = false;
		this.vertices.delete(id);

		this.edges.forEach(({ vertices }, key) => {
			const { from, to } = vertices;
			if (from === id || to === id) this.edges.delete(key);
		});
	}

	/**
	 * Returns true if an edge with the given id exists
	 * @param  {base_id} id
	 * @returns boolean
	 */
	hasVertex(id: base_id): boolean {
		return this.vertices.has(id);
	}

	/**
	 * Returns true if an edge with the given id exists
	 * @param  {base_id} id
	 * @returns boolean
	 */
	hasVertices(ids: base_id[]): boolean {
		return ids.every((id) => this.vertices.has(id));
	}

	/**
	 * Get in-neighbors of a given vertex.
	 *
	 * Returns [] if network is undirected.
	 * @param  {base_id} id
	 * @returns base_id[]
	 */
	inNeighbors(id: base_id): base_id[] {
		const in_neighbors: base_id[] = [];
		if (!this.is_directed) return in_neighbors;

		this.edges.forEach(({ vertices }) => {
			const { from, to } = vertices;
			if (to === id) in_neighbors.push(from);
		});

		return in_neighbors;
	}

	/**
	 * Get out-neighbors of a given vertex.
	 *
	 * Returns [] if network is undirected.
	 * @param  {base_id} id
	 * @returns base_id[]
	 */
	outNeighbors(id: base_id): base_id[] {
		const out_neighbors: base_id[] = [];
		if (!this.is_directed) return out_neighbors;

		this.edges.forEach(({ vertices }) => {
			const { from, to } = vertices;
			if (from === id) out_neighbors.push(to);
		});

		return out_neighbors;
	}

	/**
	 * Get list of neighbors to a vertex.
	 * @param  {base_id} id vertex id
	 * @returns neighbours as an array of base_id
	 */
	neighbors(id: base_id): base_id[] {
		const neighborhood: base_id[] = [];

		this.edges.forEach(({ vertices }) => {
			const { from, to } = vertices;
			if (from === id) neighborhood.push(to);
			else if (to === id) neighborhood.push(from);
		});

		return neighborhood;
	}

	/**
	 * Get list of neighbors to a vertex with weight included
	 *
	 * Uses a cache to speed up the search as this method is used in Dijkstra().
	 *
	 * @param node_id vertex id
	 * @returns neighbours as an array of {to: , weight: }
	 * @author ESHome33 - 2024
	 */
	edge_neighbors(id: base_id, oriented: boolean): VertexNeighbor[] {
		//NOTE: neighbor cache usage or constructs the cache
		if (!this._neighbors_cached) {
			// construct neighbor cache
			this.constructNeighborsCache(oriented);
		}
		// retrieve neighborhood from cache
		const retour = this._neighbors[id];
		return retour;
	}

	/**
	 * Return the degree of a vertex with the given ID.
	 * @param  {base_id} id
	 * @returns number
	 */
	degree(id: base_id): number {
		let vertex_degree = 0;

		this.edges.forEach(({ vertices }) => {
			const { from, to } = vertices;
			if (from === id || to === id) vertex_degree++;
		});

		return vertex_degree;
	}

	/**
	 * Return the in-degree of a vertex.
	 *
	 * The in-degree of a vertex is the sum of the dregrees of the edges that are directed to it.
	 * @param  {base_id} id
	 * @returns number
	 */
	inDegree(id: base_id): number {
		let in_degree = 0;
		if (!this.is_directed) return in_degree;

		this.edges.forEach(({ vertices }) => {
			const { to } = vertices;
			if (to === id) in_degree++;
		});

		return in_degree;
	}

	/**
	 * Return the out-degree of a vertex.
	 *
	 * The out-degree of a vertex is the sum of the dregrees of the edges that are directed away from it.
	 * @param  {base_id} id
	 * @returns number
	 */
	outDegree(id: base_id): number {
		let out_degree = 0;
		if (!this.is_directed) return out_degree;

		this.edges.forEach(({ vertices }) => {
			const { from } = vertices;
			if (from === id) out_degree++;
		});

		return out_degree;
	}

	/**
	 * Average degree of a given vertex.
	 * @param  {base_id} id
	 * @returns number
	 */
	averageDegree(id: base_id): number {
		let neighbor_degree_sum = 0;

		this.neighbors(id).forEach((neighbor_id) => {
			neighbor_degree_sum += this.degree(neighbor_id);
		});

		return neighbor_degree_sum / this.degree(id);
	}

	/**
	 * Performs the given operation over the two vertices of all edges and returns the average.
	 * @param  {(from:base_id,to:base_id)=>number} operation which takes the two ids of from and to vertices
	 * @returns the average (sum of operation done divided by number of edges in this Network)
	 */
	edgeAverageOperation(operation: (vertices: EdgeArgs) => number): number {
		let total = 0;
		this.edges.forEach(({ vertices }) => (total += operation(vertices)));

		return total / this.edges.size;
	}

	/**
	 * Performs the given operations over the two vertices of all edges and returns the average.
	 * @param  {(from:base_id,to:base_id)=>number} operation
	 */
	edgeAverageOperationList(operations: Array<(vertices: EdgeArgs) => number>) {
		let totals = new Array(operations.length).fill(0);
		this.edges.forEach(
			({ vertices }) =>
				(totals = totals.map(
					(total, index) => (total += operations[index](vertices))
				))
		);

		return totals.map((total) => total / this.edges.size);
	}

	/**
	 * [Assortativity](https://storage.googleapis.com/plos-corpus-prod/10.1371/journal.pone.0008090/1/pone.0008090.s001.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=wombat-sa%40plos-prod.iam.gserviceaccount.com%2F20220201%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20220201T012508Z&X-Goog-Expires=86400&X-Goog-SignedHeaders=host&X-Goog-Signature=525560a6254f5c978b9405a251534227f2f456692efcfe35f50b3716fee077481f914c530ed7545fe2d58f685cd98b22a31a874b419921cdd3ba2713c946a6ff60e69953a8ce304412618072f2cf8c58fa556f43a0c54197644a8405b219d29f59f27c4346261d0e1409e933984724af4171826ebc5039a5759366de138019bb7f56d08f91d5ec1f55dbb32428515fd011c1d8fb07c3d16614e7f6db0cad43501d96fd7ed48549d3977e5599c430ca6562d227e35455023e580abd8bb66c9277a42c52d628d8b675967d9cfb9754e1b80b6af60ea8373c72a2194d4a66d17bffe570751bb62e8eb2563c036150c063393b058758d9e599cd32a13ed17fc143bb) of a given vertex.
	 * @param  {base_id} id
	 * @returns number
	 */
	assortativity(): number {
		const [edge_multi, edge_sum, edge_sqr_sum] =
			this.edgeAverageOperationList([
				({ from, to }) => this.degree(from) * this.degree(to),
				({ from, to }) => this.degree(from) + this.degree(to),
				({ from, to }) => this.degree(from) ** 2 + this.degree(to) ** 2,
			]);

		return (
			(4 * edge_multi - edge_sum ** 2) / (2 * edge_sqr_sum - edge_sum ** 2)
		);
	}

	/**
	 * Creates a [complement](https://www.wikiwand.com/en/Complement_graph) network.
	 * @returns Network
	 */
	complement(): Network {
		const complement_network = new Network({ is_directed: this.is_directed });

		this.vertices.forEach((vertex_a) => {
			const { id: id_a } = vertex_a;
			this.vertices.forEach((vertex_b) => {
				const { id: id_b } = vertex_b;
				if (id_a !== id_b) {
					if (!this.hasEdge(id_a, id_b))
						complement_network.addEdge({ from: id_a, to: id_b });
					if (complement_network.is_directed && !this.hasEdge(id_b, id_a))
						complement_network.addEdge({ from: id_b, to: id_a });
				}
			});
		});

		return complement_network;
	}

	/**
	 * Creates an [ego network](https://transportgeography.org/contents/methods/graph-theory-definition-properties/ego-network-graph/) of the vertex with the given id.
	 * @param  {base_id} id
	 * @returns Network
	 */
	ego(id: base_id): Network {
		const ego_network = new Network(this.args);

		this.edges.forEach((edge) => {
			const { from, to } = edge.vertices;
			if (from === id || to === id) {
				ego_network.addEdge({ from, to });
			}
		});

		this.edges.forEach(({ vertices }) => {
			const { from, to } = vertices;
			if (ego_network.vertices.has(from) && ego_network.vertices.has(to))
				ego_network.addEdge({ from, to });
		});

		return ego_network;
	}

	/**
	 * Returns a copy of the network.
	 * @returns Network
	 */
	copy(): Network {
		const network_copy = new Network(this.args);
		network_copy.addEdgeMap(this.edges);
		network_copy.addVertexMap(this.vertices);
		return network_copy;
	}

	/**
	 * Calculates the [clustering coefficient](https://www.wikiwand.com/en/Clustering_coefficient)
	 * of a given vertex.
	 * @param  {base_id} id
	 * @returns number
	 */
	clustering(id: base_id): number {
		const ego_net = this.ego(id);

		if (ego_net.vertices.size <= 1) return 0;

		const centerless_ego = ego_net;

		// Max edges in a network without the given vertex.
		centerless_ego.removeVertex(id);
		const { max_edges } = centerless_ego;
		const existing_edges = centerless_ego.edges.size;

		// If graph is directed, multiply result by 2.
		const directed_const = this.is_directed ? 2 : 1;

		return directed_const * (existing_edges / max_edges);
	}

	/**
	 * Calculates the newtork's average [clustering](https://www.wikiwand.com/en/Clustering_coefficient).
	 * @returns number
	 */
	averageClustering(): number {
		let average_clustering = 0;

		if (this.vertices.size <= 1) return average_clustering;

		const clustering_sum = this.vertex_list
			.map((vertex) => this.clustering(vertex.id))
			.reduce((prev, curr) => prev + curr);

		average_clustering = clustering_sum / this.vertices.size;

		return average_clustering;
	}

	/**
	 * Creates a [k-core](https://www.wikiwand.com/en/Degeneracy_(graph_theory)) decomposition of a network.
	 * @param  {number} k
	 * @returns Network
	 */
	core(k: number): Network {
		const k_decomposition = this.copy();

		while (k > 0 && k_decomposition.vertices.size > 0) {
			let { vertex_list } = k_decomposition;
			let vertex_counter;
			for (
				vertex_counter = 0;
				vertex_counter < vertex_list.length;
				vertex_counter++
			) {
				const current_vertex = k_decomposition.vertex_list[vertex_counter];
				if (k_decomposition.degree(current_vertex.id) < k) {
					k_decomposition.removeVertex(current_vertex.id);
					vertex_list = k_decomposition.vertex_list;
					vertex_counter = 0;
				}
			}
			k--;
		}

		return k_decomposition;
	}

	/**
	 * Returns a list with all triplets in the network.
	 * @returns Cycle[]
	 */
	triplets(): Cycle[] {
		const triplet_list: Cycle[] = [];

		const k2 = this.core(2);

		const { edges } = k2;

		const { is_directed } = this;

		edges.forEach((initial_edge) => {
			const { from, to } = initial_edge.vertices;

			const neighbors_from = k2.neighbors(from);
			const neighbors_to = k2.neighbors(to);

			let neighbors = neighbors_from;
			if (neighbors_to.length < neighbors.length) neighbors = neighbors_to;

			neighbors.forEach((id) => {
				if (initial_edge.hasVertex(id)) return;
				const triplet = new Cycle({
					is_directed,
					initial_edge: initial_edge.args,
				});

				if (triplet.addEdge(k2.edgeBetween(triplet.tip, id)?.args))
					if (
						triplet.close(k2.edgeBetween(triplet.tip, triplet.loop)?.args)
					)
						if (
							triplet_list.every((t) => !t.isSameAs(triplet)) &&
							triplet.is_complete
						)
							triplet_list.push(triplet);
			});
		});

		return triplet_list;
	}

	/**
	 * Algorithm to find all quadruplets in a network.
	 * @returns Cycle[]
	 */
	quadruplets(): Cycle[] {
		const c4: Cycle[] = [];

		const k2 = this.core(2);
		const edges1 = k2.edges;

		edges1.forEach((edge1) => {
			const initial_edge = edge1.args;
			let loop_vertex = edge1.vertices.from;
			let pair_vertex = edge1.pairVertex(loop_vertex)!;
			let pair_vertex_neighbors = k2.neighbors(pair_vertex);

			if (!k2.is_directed) {
				const loop_vertex_neighbors = k2.neighbors(loop_vertex);
				if (pair_vertex_neighbors.length > loop_vertex_neighbors.length) {
					const temp = loop_vertex;
					loop_vertex = pair_vertex;
					pair_vertex = temp;
					pair_vertex_neighbors = loop_vertex_neighbors;
				}
			}

			pair_vertex_neighbors.forEach((vertex) => {
				const parallel_edges = k2.is_directed
					? k2.edgesFrom(vertex)
					: k2.edgesWith(vertex);

				parallel_edges.forEach((p_edge) => {
					const cycle = new Cycle({
						is_directed: k2.is_directed,
						initial_edge,
						loop_vertex,
					});

					if (cycle.addEdge(k2.edgeBetween(cycle.tip, vertex)?.args))
						if (cycle.addEdge(p_edge.args))
							if (
								cycle.close(
									k2.edgeBetween(cycle.tip, loop_vertex)?.args
								)
							)
								if (!c4.some((c) => c.isSameAs(cycle))) c4.push(cycle);
				});
			});
		});

		return c4;
	}

	private genSquare(
		edge: Edge,
		parallel: Edge,
		k2: Network,
		loop_vertex?: base_id
	): Cycle | undefined {
		const { is_directed } = k2;
		const initial_edge = edge.args;
		const cycle = new Cycle({ is_directed, initial_edge, loop_vertex });
		if (
			!cycle.addEdge(
				k2.edgeBetween(cycle.tip, parallel.vertices.from)?.args
			) &&
			!is_directed
		)
			cycle.addEdge(k2.edgeBetween(cycle.tip, parallel.vertices.to)?.args);
		cycle.addEdge(parallel.args);
		cycle.close(k2.edgeBetween(cycle.tip, cycle.loop)?.args);

		if (cycle.length === 4 && cycle.is_complete) return cycle;
	}

	quadrupletsEdgePairing(): Cycle[] {
		const c4: Cycle[] = [];
		const k2 = this.core(2);

		const { is_directed } = k2;
		k2.edges.forEach((edge) => {
			k2.edges.forEach((parallel) => {
				const square = this.genSquare(edge, parallel, k2);
				if (square !== undefined && !c4.some((c) => c.isSameAs(square)))
					c4.push(square);
				if (!is_directed) {
					const square_undirected = this.genSquare(
						edge,
						parallel,
						k2,
						edge.args.to
					);
					if (
						square_undirected !== undefined &&
						!c4.some((c) => c.isSameAs(square_undirected))
					)
						c4.push(square_undirected);
				}
			});
		});

		return c4;
	}

	/**
	 * Edges that start at vertex_id. Excluding edges with a `to` vertex in the `except` array
	 * @param  vertex_id l'index du noeud pour lequel on cherche les arcs sortants.
	 * @param  except tableau qui indique les noeuds à exclure
	 * @returns an edge array
	 */
	edgesFrom(vertex_id: base_id, except: base_id[] = []): Edge[] {
		return this.edge_list.filter(
			(edge) =>
				edge.vertices.from === vertex_id &&
				!except.includes(edge.vertices.to)
		);
	}

	/**
	 * Returns all edges with the given vertex, regardless of the position of the vertex (`from` or `to`).
	 * @param  {base_id} vertex_id
	 * @returns Edge
	 */
	edgesWith(vertex_id: base_id): Edge[] {
		return this.edge_list.filter(
			(edge) =>
				edge.vertices.from === vertex_id || edge.vertices.to === vertex_id
		);
	}

	/**
	 * Returns the given vertex's neighborhood. That is, the neighborhood of both its vertices.
	 * @param  {Edge} edge
	 * @returns EdgeNeighborhood
	 */
	edgeNeighbors(edge: Edge): EdgeNeighborhood {
		const { from, to } = edge.vertices;
		const edge_neighbors: EdgeNeighborhood = {
			from: { id: from, neighbors: this.neighbors(from) },
			to: { id: to, neighbors: this.neighbors(to) },
		};

		return edge_neighbors;
	}

	/**
	 * Generates a random ID that has not yet been used in the network.
	 * @returns base_id
	 */
	newVID(): base_id {
		let id = this.free_vid++;
		while (this.vertices.has(id)) {
			id = Math.floor(Math.random() * this.vertex_limit);
		}
		return id;
	}

	/**
	 * Generates a new ID for an edge being generated.
	 * @returns number
	 */
	private newEID(): number {
		let id = this.free_eid++;
		while (this.edges.has(id)) {
			id = Math.floor(Math.random() * this.edge_limit);
		}
		return id;
	}

	/**
	 * Checks if the two given edges are the same.
	 * @param  {EdgeArgs} edge_a
	 * @param  {EdgeArgs} edge_b
	 * @param  {Boolean} [is_directed=this.is_directed]
	 * @returns boolean
	 */
	private checkEdgeIsSame(
		edge_a: EdgeArgs,
		edge_b: EdgeArgs,
		is_directed: boolean = this.is_directed
	): boolean {
		if (edge_a.from === edge_b.from && edge_a.to === edge_b.to) return true;
		else if (
			edge_a.to === edge_b.from &&
			edge_a.from === edge_b.to &&
			!is_directed
		)
			return true;
		return false;
	}
}

export class Cycle extends Network {
	private loop_vertex: base_id;
	private tip_vertex: base_id;
	private is_closed: boolean;
	private dynamic_product: number;

	constructor(args: {
		is_directed: boolean;
		initial_edge: EdgeArgs;
		loop_vertex?: base_id;
	}) {
		super(args);
		const { initial_edge, loop_vertex, is_directed } = args;
		super.addEdge(initial_edge);
		this.loop_vertex = initial_edge.from;
		this.tip_vertex = initial_edge.to;
		if (
			!is_directed &&
			loop_vertex !== undefined &&
			this.hasVertex(loop_vertex)
		) {
			this.loop_vertex = loop_vertex;
			this.tip_vertex = this.edge_list[0].pairVertex(loop_vertex)!;
		}
		this.is_closed = false;
		this.dynamic_product = 1;
		this.updateProduct(initial_edge);
	}

	/**
	 * Getter for the tip of the cycle.
	 * @returns base_id
	 */
	get tip(): base_id {
		return this.tip_vertex;
	}

	get loop(): base_id {
		return this.loop_vertex;
	}

	get product(): number {
		if (this.is_closed) return this.dynamic_product;
		return 0;
	}

	get path(): base_id[] {
		const resu: base_id[] = [];
		const k = this.vertices.keys();

		for (const val of k) {
			resu.push(val);
		}
		return resu;
	}

	/**
	 * Returns true if the cycle is closed, otherwise returns false.
	 * @returns boolean
	 */
	get is_complete(): boolean {
		return this.is_closed;
	}

	get length(): number {
		return this.vertices.size;
	}

	/**
	 * Adds an edge to the cycle if possible.
	 * Returns true if the addition is successful.
	 * @param  {EdgeArgs|undefined} edge
	 * @returns boolean
	 */
	addEdge(edge: EdgeArgs | undefined): boolean {
		if (edge !== undefined && this.canAdd(edge)) {
			super.addEdge(edge);
			if (!this.is_directed && this.tip_vertex === edge.to)
				this.tip_vertex = edge.from;
			else this.tip_vertex = edge.to;

			this.updateProduct(edge);

			return true;
		}

		return false;
	}

	/**
	 * Tries to close the cycle.
	 * Returns true if the operation was sucessful.
	 * @param  {EdgeArgs|undefined} edge
	 * @returns boolean
	 */
	close(edge: EdgeArgs | undefined): boolean {
		if (edge !== undefined && this.canCloseWith(edge)) {
			super.addEdge(edge);
			this.is_closed = true;
			this.tip_vertex = this.loop_vertex;
			this.updateProduct(edge);
			return true;
		}

		return false;
	}

	/**
	 * Compares the cycle with a given cycle.
	 * Returns whether they are the same or not.
	 * @param  {Cycle} cycle
	 * @returns boolean
	 */
	isSameAs(cycle: Cycle): boolean {
		if (this.is_directed !== cycle.is_directed) return false;
		return this.edge_list.every(({ vertices }) => {
			return cycle.edge_list.some(({ vertices: compare }) => {
				return (
					(compare.from === vertices.from && compare.to === vertices.to) ||
					(!this.is_directed &&
						compare.from === vertices.to &&
						compare.to === vertices.from)
				);
			});
		});
	}

	private updateProduct(edge: EdgeArgs) {
		const weight = edge.weight ?? 1;
		this.dynamic_product *= this.tip_vertex === edge.to ? weight : 1 / weight;
	}

	private canCloseWith(edge: EdgeArgs): boolean {
		const edge_has_tip_and_loop_vertex =
			(edge.from === this.tip_vertex && edge.to === this.loop_vertex) ||
			(!this.is_directed &&
				edge.to === this.tip_vertex &&
				edge.from === this.loop_vertex);

		return (
			!this.is_closed &&
			edge_has_tip_and_loop_vertex &&
			this.vertices.size > 2
		);
	}

	private canAdd(edge: EdgeArgs) {
		const creates_loop =
			(edge.from === this.tip_vertex && !this.hasVertex(edge.to)) ||
			(!this.is_directed &&
				edge.to === this.tip_vertex &&
				!this.hasVertex(edge.from));

		return !this.is_closed && creates_loop;
	}
}
