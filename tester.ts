/*
deno run --allow-read --allow-write tester.ts
*/

import {
	genCompleteNetwork,
	genRandomNetwork,
	loadAdjacencyMatrix,
} from "./algorithms";
import Network from "./network";

const start_time = new Date().getTime();

export async function testSpeed(network: Network, algo: string, params: any) {
	const start_time = new Date().getTime();
	await network[algo](params);
	const end_time = new Date().getTime();
	const elapsed_time = (end_time - start_time) / 1000;
	console.log("Time taken: ", elapsed_time);
}

function logNetwork(network: Network) {
	return (
		"\n" + `${network.net_informations}`
		// "\n" +
		// `liste des noeuds = ${JSON.stringify(network.vertex_list)}` +
		// "\n" +
		// `liste des arcs = ${JSON.stringify(network.edge_list)}` +
		// "\n"
	);
}

function valuesTest(network: Network) {
	return (
		"--Values Test--\n" +
		`Weight:                ${network.weight}\n` +
		`Genus:                 ${network.genus}\n` +
		`Clique Size:           ${network.max_edges}\n` +
		`Density:               ${network.density}\n` +
		`Clustering for 6:    ${network.clustering("6")}\n`
	);
}

function algorithmTest(network: Network) {
	let test_string = "--Algorithms Tests--\n";

	const k_core = 10;
	const k10 = network.core(k_core);
	test_string += `${k_core}-core decomposition vertice number: ${k10.vertices.size}\n`;
	test_string += `${k_core}-core decomposition edge number: ${k10.edges.size}\n`;

	const triplets_start_time = new Date().getTime();
	const triplets = network.triplets();
	const triplets_end_time = new Date().getTime();
	test_string += `Number of triplets: ${triplets.length}\n`;
	test_string += `10 triplets sample: ${triplets.filter(
		(value, index) => index < 10
	)}\n`;
	test_string += `  -triplets algorithm time: ${
		(triplets_end_time - triplets_start_time) / 1000
	}\n`;

	const assortativity_start = new Date().getTime();
	test_string += `Network assortativity: ${network.assortativity()}\n`;
	test_string += `  -time taken: ${
		(new Date().getTime() - assortativity_start) / 1000
	}`;

	return test_string;
}

function getTestTime(): string {
	const date = new Date();
	return (
		date.getDate() +
		"_" +
		date.getMonth() +
		"_" +
		date.getFullYear() +
		"_" +
		date.getHours()
	);
}

async function quadrupletsAdjacencyMatrixTimeTesting() {
	const net_csv = await loadAdjacencyMatrix("./data/FTXAdjacencyMatrix.csv");

	let algo_start = Date.now();
	const quad_csv_pair = net_csv.quadrupletsEdgePairing();
	const pair_time = (Date.now() - algo_start) / 1000;
	console.log("Edge pairing time taken:", pair_time);
	console.log("Edge pairing size:", quad_csv_pair.length);
	console.log("----------");
	algo_start = Date.now();
	const quad = net_csv.quadruplets();
	const quad_time = (Date.now() - algo_start) / 1000;
	// console.log(quad_csv_pair.map((c) => [...c.simple_edge_list]));
	console.log("Quadruplets time taken:", quad_time);
	console.log("Quad size:", quad.length);
}

async function mainTest() {
	const net_csv = await loadAdjacencyMatrix("./data/FTXAdjacencyMatrix.csv");
	let test_data = valuesTest(net_csv) + "\n" + algorithmTest(net_csv);
	const end_time = new Date().getTime();
	const elapsed_time = (end_time - start_time) / 1000;
	test_data += "\nElapsed time: " + elapsed_time;
	// Deno.writeTextFile(
	//   `./data/test_${getTestTime()}_${Math.floor(200 * Math.random())}.txt`,
	//   test_data
	// );
}

function compareQuadAlgorithms(net: Network, debug = false) {
	let start = Date.now();

	const quad = net.quadruplets();
	const quad_time = (Date.now() - start) / 1000;

	start = Date.now();
	const quad_pair = net.quadrupletsEdgePairing();
	const quad_pair_time = (Date.now() - start) / 1000;

	if (debug) {
		console.log("Quad algorithm");
		console.log(quad.length);
		console.log("Time taken: ", quad_time);

		console.log("------");

		console.log("Edge pairing algorithm");
		console.log(quad_pair.length);
		console.log("Time taken: ", quad_pair_time);
	}

	return [quad_time, quad_pair_time];
}

function getQuadTime(net: Network): number {
	const start = Date.now();
	net.quadruplets();
	return (Date.now() - start) / 1000;
}
function getPairTime(net: Network): number {
	const start = Date.now();
	net.quadrupletsEdgePairing();
	return (Date.now() - start) / 1000;
}

function quadEfficiencyTest(num = 20) {
	const quad_data: number[] = [];
	for (let n = 4; n < num; n++) {
		console.log(n);
		const complete_net = genCompleteNetwork(n);
		quad_data.push(getQuadTime(complete_net));
	}

	// Deno.writeTextFile(`./data/quad_data.json`, JSON.stringify(quad_data));
}

function pairEfficiencyTest(num = 20) {
	const quad_data: number[] = [];
	for (let n = 4; n < num; n++) {
		console.log(n);
		const complete_net = genCompleteNetwork(n);
		quad_data.push(getPairTime(complete_net));
	}

	// Deno.writeTextFile(`./data/quad_pair_data.json`, JSON.stringify(quad_data));
}

function randomNetEfficiencyTest(
	number_vertices = 20,
	edges_num = { min: 10, max: 50 },
	name = `random_efficiency_test.json`
) {
	const quad: number[] = [];
	const pair: number[] = [];
	const net_list: number[] = [];

	for (
		let number_edges = edges_num.min;
		number_edges < edges_num.max;
		number_edges++
	) {
		console.log(number_edges);
		const net = genRandomNetwork({ number_vertices, number_edges });

		if (!net_list.includes(net.edges.size)) {
			quad.push(getQuadTime(net));
			pair.push(getPairTime(net));

			net_list.push(net.edges.size);
		}
	}

	// Deno.writeTextFile(
	//   `./data/${name}`,
	//   JSON.stringify({ quad, pair, number_vertices, net_list })
	// );
}

function quadrupletsEfficiencyTest(num = 20) {
	quadEfficiencyTest(num);
	pairEfficiencyTest(num);
}

function generalTesting() {
	const test_net = new Network();
	try {
		test_net.addEdgeList([
			["a", "b", 1],
			["a", "c", 2],
			["b", "d", 2],
			["b", "f", 3],
			["c", "d", 3],
			["c", "e", 4],
			["d", "e", 2],
			["d", "f", 3],
			["d", "g", 3],
			["e", "g", 5],
			["f", "g", 4],
		]);

		const dij = test_net.dijkstra("a", "g");
		console.log(`Dijkstra = ${JSON.stringify(dij)}`);
		let arrivee = "f";
		let ret = test_net.analysePredecesseurs(test_net.predecessor, arrivee);
		console.log(`chemin de a vers ${arrivee} = ${ret}`);
		arrivee = "e";
		ret = test_net.analysePredecesseurs(test_net.predecessor, arrivee);
		console.log(`chemin de a vers ${arrivee} = ${ret}`);
		arrivee = "g";
		ret = test_net.analysePredecesseurs(test_net.predecessor, arrivee);
		console.log(`chemin de a vers ${arrivee} = ${ret}`);
	} catch (e) {
		console.log(e);
	}
}

const etienne_tests = async () => {
	// compareQuadAlgorithms(nex.genCompleteNetwork(10), true);
	// randomNetEfficiencyTest(20, { min: 20, max: 120 }, "rand_dense.json");

	// const start = Date.now();
	const net = await loadAdjacencyMatrix("./data/networkMatrix.csv");
	// console.log(net.triplets().length, Date.now() - start);

	//const net = genRandomNetwork({ number_edges: 1200, number_vertices: 300 });
	//console.log(net.quadruplets().map(({ path }) => path));
	console.log(` ${logNetwork(net)}`);
	console.log(` ${net.dot_description}`);
	// console.log(`neighbr = ${JSON.stringify(net.ranked_neighborhood)}`);
	// console.log(`Vertices avant infini = ${JSON.stringify(net.positive_vertices)}`);
	let liste: string[];
	let chemin: string = "PAS DE CHEMIN";
	try {
		liste = net.dijkstra("BTC", "EUR");
		chemin = net.analysePredecesseurs(net.predecessor, "USDT");
	} catch (error) {
		console.log(error.message);
	}
	//console.log(`Vertices après infini = ${JSON.stringify(net.positive_vertices)}`);
	console.log(`resu Dijkstra = ${JSON.stringify(liste)}`);
	console.log(`chemin entre EUR et USDT = ${chemin}`);
	console.log("Test end !");
};

etienne_tests();
//generalTesting();
