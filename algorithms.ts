import Network from "./network.js";
import { ParsedCSV, base_id, NetworkArgs } from "./enums.js";
import * as fs from "node:fs/promises";

/**
 * Generates a network with the given number of nodes and edges.
 *
 * @param  {Object} args les caractéristiques du graphe
 * @param  {number} args.number_vertices nombre de noeuds
 * @param  {number} args.number_edges nombre d'arcs
 * @param  {boolean} [args.is_directed] le graphe est-il dirigé (FALSE par default)
 * @param args.edge_tries le nombre max d'arcs par noeud (30 par défaut)
 * @returns Network le nouveau graphe aléatoire créé.
 */
export function genRandomNetwork(args: {
	number_vertices: number;
	number_edges: number;
	is_directed?: boolean;
	edge_tries?: number;
}): Network {
	let { number_vertices, number_edges, is_directed } = args;
	is_directed ??= false;
	const net = new Network({ is_directed });

	for (let vertex = 0; vertex < number_vertices; vertex++)
		net.addVertex({ id: vertex });

	let edge_tries = args.edge_tries ?? 30;
	while (net.edges.size < number_edges && edge_tries > 0) {
		const from = Math.floor(Math.random() * number_vertices);
		const to = Math.floor(Math.random() * number_vertices);
		const wgt = Math.floor(Math.random() * number_vertices);
		if (
			from !== to &&
			net.addEdge({ from, to, do_force: false, weight: wgt })
		) {
			edge_tries = args.edge_tries ?? 30;
		}

		edge_tries--;
	}

	return net;
}

export function genCompleteNetwork(
	size: number,
	args: NetworkArgs = {}
): Network {
	const complete_net = new Network(
		Object.assign(args, {
			vertex_limit: size,
			edge_limit: Math.floor((size * (size - 1)) / 2),
		})
	);

	for (let vertex = 0; vertex < size; vertex++) {
		complete_net.addVertex({ id: vertex });
		complete_net.vertices.forEach((v) => {
			if (v.id !== vertex) {
				complete_net.addEdge({ from: v.id, to: vertex });
			}
		});
	}

	return complete_net;
}

/**
 * Reads an [adjacency matrix](https://www.wikiwand.com/en/Adjacency_matrix) CSV and returns a network object.
 * @param  {string} file_name
 * @returns Network
 */
export async function loadAdjacencyMatrix(
	file_name: string,
	is_directed = false
): Promise<Network> {
	const traiteData = (data: string[]) => {
		const parsed_csv = parseCSV([...data]);

		const vertex_limit = parsed_csv[0].length;
		const edge_limit =
			(parsed_csv[0].length * (parsed_csv[0].length - 1)) / 2;

		const csv_network = new Network({
			is_directed,
			vertex_limit,
			edge_limit,
		});

		parsed_csv[0].forEach((vertex, index) => {
			if (index === 0) return;
			csv_network.addVertex({ id: vertex });
		});

		if (!is_directed) {
			parsed_csv.forEach((line, line_number) => {
				if (line_number === 0) return;
				line.forEach((edge_weight, column_number) => {
					if (column_number === 0) return;
					const weight = +edge_weight;
					if (weight) {
						const from = parsed_csv[line_number][0];
						const to = parsed_csv[0][column_number];
						csv_network.addEdge({ from, to, weight });
					}
				});
			});
		}
		return csv_network;
	};

	try {
		const fic: string = await fs.readFile(file_name, { encoding: "utf-8" });
		const lignes: string[] = fic.split("\n");
		return traiteData(lignes);
	} catch (error) {
		return new Network();
	}
}

/**
 * Parses a CSV. Only uses the comma as the separator
 * @param  {string[]} csv_file un tableau de lignes. Chaque ligne est un string comportant les valeurs séparées par une virgule
 * @returns ParsedCSV un tableau de tableau de string qui comporte chaque élément et où les virgules ont été otées.
 */
function parseCSV(csv_file: string[]): ParsedCSV {
	const parsed_csv: ParsedCSV = [];

	csv_file.forEach((line) => {
		if (line == "\n" || line == "") {
			return;
		}
		const contenu: string[] = line.split(",");
		parsed_csv.push(contenu);
	});

	return parsed_csv;
}

/**
 * Write to a CSV file.
 * @param rows les lignes à écrire
 * @param [file_name="adjacencyMatrix.csv"] le nom à donner au fichier. Par défaut c'est ```adjacencyMatrix.csv```
 */
async function writeCSV(
	rows: Array<Array<string | number>>,
	file_name = "adjacencyMatrix.csv"
) {
	let csv = "";
	rows.forEach((row) => {
		row.forEach((element, i) => {
			csv += `${element + (i === row.length - 1 ? "\n" : ",")}`;
		});
	});
	const ret = await fs.writeFile(file_name, csv);
}

/**
 * Exports given network into an adjacency matrix in the form of a CSV file.
 * @param  {Network} network
 * @param  {string} file_name ```adjacencyMatrix.csv``` default value
 */
export async function writeAdjacencyMatrix(
	network: Network,
	file_name: string = "adjacencyMatrix.csv"
) {
	const number_of_rows = network.vertices.size + 1;
	const rows: Array<Array<base_id>> = [...Array(number_of_rows)].map(() =>
		Array(number_of_rows).fill(0)
	);

	network.vertex_list.forEach((vertex, i) => {
		rows[0][i + 1] = vertex.id;
		rows[i + 1][0] = vertex.id;
		network.vertex_list.forEach((vertex2, j) => {
			if (network.hasEdge(vertex2.id, vertex.id)) {
				rows[i + 1][j + 1] = 1;
				rows[j + 1][i + 1] = 1;
			}
		});
	});

	await writeCSV(rows, file_name);
}
