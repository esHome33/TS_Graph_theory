/**
 * un noeud destination et le poids de l'arc menant à ce noeud
 */
class NodeVertex {
	nameOfVertex: string;
	weight: number;
}

/**
 * les arcs partant d'un noeud de départ
 * et le poids du noeud de départ
 */
class Vertex {
	name: string;
	nodes: NodeVertex[];
	weight: number;

	constructor(theName: string, theNodes: NodeVertex[], theWeight: number) {
		this.name = theName;
		this.nodes = theNodes;
		this.weight = theWeight;
	}
}

/**
 * Algorithme du plus court chemin Dijkstra
 */
class Dijkstra {
	vertices: any;
	constructor() {
		this.vertices = {};
	}

	addVertex(vertex: Vertex): void {
		this.vertices[vertex.name] = vertex;
	}

	/**
	 * Dans un graphe dont on a calculé les flux minimaux, trouve le chemin de flux minimal entre le 
	 * noeud d'arrivée et le noeud de départ.
	 * 
	 * @param start noeud de départ
	 * @param finish noeud d'arrivée.
	 * @param min_valuation la valuation minimale à atteindre (permet d'oter l'ambiguité)
	 * @returns la liste des noms de noeuds qui constituent 
	 * le chemin de valuation minimale dans le graphe
	 */
	findPointsOfShortestWay(
		start: string,
		finish: string,
		min_valuation: number,
	): string[] {
		let nextVertex: string = finish;
		let arrayWithVertex: string[] = [];
		while (nextVertex !== start) {
			let minWeigth: number = Number.MAX_VALUE;
			let minVertex: string = "";
			for (let i of this.vertices[nextVertex].nodes) {
				const poids_flux = this.vertices[i.nameOfVertex].weight;
				const poids_calcule = i.weight + poids_flux;
				if (poids_calcule < minWeigth ) {
					minWeigth = poids_flux;
					minVertex = `${nextVertex}->${i.nameOfVertex}`;
				}
			}
			arrayWithVertex.push(minVertex);
			nextVertex = minVertex;
		}
		return arrayWithVertex;
	}

	/**
	 * Implémentation de l'algorithme de Dijkstra dans un graphe orienté.
	 * 
	 * @param start nom du noeud de départ
	 * @param finish nom du noeud d'arrivée
	 * @returns la liste des points qui constituent le chemin de valuation minimale.
	 */
	findShortestWay(
		start: string,
		finish: string
	): string[] {
		let nodes: any = {};
		

		// initialisation des poids de chaque noeud et ajout dans la liste nodes.
		for (let i in this.vertices) {
			if (this.vertices[i].name === start) {
				this.vertices[i].weight = 0;
			} else {
				this.vertices[i].weight = Number.MAX_VALUE;
			}
			nodes[this.vertices[i].name] = this.vertices[i].weight;
		}

		while (Object.keys(nodes).length !== 0) {
			let sortedVisitedByWeight: string[] = Object.keys(nodes).sort(
				(a, b) => this.vertices[a].weight - this.vertices[b].weight
			);
			let currentVertex: Vertex = this.vertices[sortedVisitedByWeight[0]];
			for (let j of currentVertex.nodes) {
				const calculateWeight: number = currentVertex.weight + j.weight;
				if (calculateWeight < this.vertices[j.nameOfVertex].weight) {
					this.vertices[j.nameOfVertex].weight = calculateWeight;
				}
			}
			delete nodes[sortedVisitedByWeight[0]];
		}
		const finishWeight: number = this.vertices[finish].weight;
		let arrayWithVertex: string[] = this.findPointsOfShortestWay(
			start,
			finish,
			finishWeight
		).reverse();
		arrayWithVertex.push(finish, finishWeight.toString());
		return arrayWithVertex;
	}
}

let dijkstra = new Dijkstra();
dijkstra.addVertex(
	new Vertex(
		"A",
		[
			{ nameOfVertex: "C", weight: 3 },
			{ nameOfVertex: "E", weight: 7 },
			{ nameOfVertex: "B", weight: 4 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"B",
		[
			{ nameOfVertex: "A", weight: 4 },
			{ nameOfVertex: "C", weight: 6 },
			//{ nameOfVertex: "D", weight: 5 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"C",
		[
			{ nameOfVertex: "A", weight: 3 },
			{ nameOfVertex: "B", weight: 6 },
			{ nameOfVertex: "E", weight: 8 },
			{ nameOfVertex: "D", weight: 11 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"D",
		[
			//{ nameOfVertex: "B", weight: 5 },
			{ nameOfVertex: "C", weight: 11 },
			{ nameOfVertex: "E", weight: 2 },
			{ nameOfVertex: "F", weight: 2 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"E",
		[
			{ nameOfVertex: "A", weight: 7 },
			{ nameOfVertex: "C", weight: 8 },
			{ nameOfVertex: "D", weight: 2 },
			{ nameOfVertex: "G", weight: 5 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"F",
		[
			{ nameOfVertex: "D", weight: 2 },
			{ nameOfVertex: "G", weight: 3 },
		],
		1
	)
);
dijkstra.addVertex(
	new Vertex(
		"G",
		[
			{ nameOfVertex: "D", weight: 10 },
			{ nameOfVertex: "E", weight: 5 },
			{ nameOfVertex: "F", weight: 3 },
		],
		1
	)
);

console.log(dijkstra.findShortestWay("D", "C"));
