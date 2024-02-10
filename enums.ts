/**
 * base type of what can be stored in a Network : ```string``` ```number```
 */
export type base_id = string | number;

/**
 * edge neighborhood of a vertex : incoming edges and outgoing edges.
 */
export interface EdgeNeighborhood {
	from: {
		id: base_id;
		neighbors: base_id[];
	};
	to: {
		id: base_id;
		neighbors: base_id[];
	};
}

/**
 * Vertex ```id``` and optional ```weight```
 */
export interface VertexArgs {
	id: base_id;
	weight?: number;
}

/**
 * all to define an Edge : ```from```  ```to```   ```id```    ```weight```   ```do_force```
 */
export interface EdgeArgs {
	from: base_id;
	to: base_id;
	id?: base_id;
	weight?: number;
	do_force?: boolean;
}

/**
 *  ```is_directed```   ```is_multigraph```   ```edge_limit```    ```vertex_limit```
 */
export interface NetworkArgs {
	is_directed?: boolean;
	is_multigraph?: boolean;
	edge_limit?: number;
	vertex_limit?: number;
}

/**
 *  array of ```string[]```
 */
export type ParsedCSV = string[][];

/**
 * different erros that can be thrown
 * during execution of NeTS' algorithms
 */
export const ERROR = {
	UNDEFINED_VALUES: "Undefined values being given as arguments!",
	EDGE_LIMIT: "Can't add new edge. Limit of Edges exceeded",
	VERTICE_LIMIT: "Can't add new vertex. Limit of Vertices exceeded",
	EXISTING_EDGE: "Trying to add an edge with already existing ID",
	EXISTING_VERTICE: "Trying to add a vertex with already existing ID",
	INEXISTENT_VERTICE: "Vertex doesn't exist",
	NOT_MULTIGRAPH:
		"Trying to add multiple edges between two vertices. Graph is not a multigraph!",
	UNDEFINED_ID: "Tried to use undefined id as input",
	SELF_LOOP: "No self-loops",
	INEXISTENT_START_VERTICE: "Start vertex doesn't exist",
	INEXISTENT_END_VERTICE: "End vertex doesn't exist",
};
