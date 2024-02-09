
Graph Theory basic utilities. This work is heavily based on rodigu's [NeTS](https://github.com/rodigu/NeTS).
I added some comments in rodigu's code in order to understand his work.

I also added a dijkstra function in Network class and some other utilities methods and properties. This function implements E. Dijkstra's shortest path finding algorithm. This algorithm works efficiently by using a [MinHeap](https://github.com/datastructures-js/heap) from eyas-ranjous [@datastructures-js](https://github.com/eyas-ranjous).

As I'm not using Deno, so I commented all stuff related to Deno out. In order to use read and write Adjacency Matrix functions for a Network, I added the import of "node:fs/promises" in algorithms.ts.

I also wanted to work and debug with vscode : a vscode launch config is added.

I went through basic tests using the tester.ts file created by rodigu.


## Dijkstra algorithm usage

```ts
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
		// dijkstra(start node, end node) provides a list of vertices and,
		// for each vertex, its best predecessor and the distance/weight to get there.
		//
    	// Understand that *all* best ways from start_node are known after dijkstra() method call.
		const dijkstra_result:DijkstraResult = test_net.dijkstra("a", "g");
    	// you can log this list :
		console.log(`table of predecessors for all vertices = ${JSON.stringify(dijkstra_result.predecessors)}`);
		// and the path from "a" to "g" is :
		const path = dijkstra_result.path;
		// but you can also get every path from "a" to an other node in the graph with method analysePredecesseurs()
		let another_node = "f";
		let path_to_another_node = test_net.analysePredecesseurs(test_net.predecessor, another_node);
		console.log(`path to ${another_node} = ${path_to_another_node}`);

```

done Feb 06, 2024.
