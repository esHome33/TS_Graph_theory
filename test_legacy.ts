import * as nex from "./extra.js";

const start = Date.now();

const work = async () => {
	const network = await nex.loadAdjacencyMatrix("./data/networkMatrix.csv");
	nex.writeAdjacencyMatrix(network, "./data/eti.csv");
	const definition_arguments: {
		number_vertices: number;
		number_edges: number;
		is_directed?: boolean;
		edge_tries?: number;
	} = {
		number_edges: 20,
		number_vertices: 10,
		is_directed: true,
		edge_tries: 5,
	};
	const network2 = nex.genRandomNetwork(definition_arguments);
	nex.writeAdjacencyMatrix(network2, "./data/new.csv");
};

work();
// nex.loadAdjacencyMatrix("./data/networkMatrix.csv").then((net) => {
// 	if (!net) {
// 		console.log("net is null !");
// 	} else {
// 		console.log(net.triplets().length, Date.now() - start);
// 	}
// });
