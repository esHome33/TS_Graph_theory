import { WeightedGraph, NeighborType } from './weighted-graph'
import PriorityQueue from '../24-binary-heaps/priority-queue'

const wgraph = new WeightedGraph()
wgraph.addEdge('A', 'B', 4)
wgraph.addEdge('B', 'E', 3)
wgraph.addEdge('A', 'C', 2)
wgraph.addEdge('C', 'D', 2)
wgraph.addEdge('D', 'E', 3)
wgraph.addEdge('C', 'F', 4)
wgraph.addEdge('D', 'F', 1)
wgraph.addEdge('E', 'F', 1)
console.log(wgraph.adjacencyList)

WeightedGraph.prototype.Dijkstra = function (start: string, finish: string) {
  const queue = new PriorityQueue()
  const distancesFromStartTo: { [vertex: string]: number } = {}
  const previous: { [vertex: string]: string } = {}
  const visited: string[] = []
  const path: string[] = []

  // Build up initial state
  for (const vertex in wgraph.adjacencyList) {
    if (vertex === start) {
      distancesFromStartTo[start] = 0
      queue.enQueue(start, 0)
    } else {
      distancesFromStartTo[vertex] = Infinity
    }
    previous[vertex] = null
  }

  while (queue.values.length) {
    const smallest = queue.deQueue().val

    // Build path
    if (smallest === finish) {
      let current = smallest
      while (current) {
        path.push(current)
        current = previous[current]
      }
      break
    }

    // Update distances & previous
    this.adjacencyList[smallest].forEach(({ node, weight }: NeighborType) => {
      if (visited.indexOf(node) === -1) {
        const candidate = distancesFromStartTo[smallest] + weight
        if (distancesFromStartTo[node] > candidate) {
          queue.enQueue(node, candidate) // add node and bubble shortest node
          distancesFromStartTo[node] = candidate
          previous[node] = smallest
        }
      }
    })
    if (visited.indexOf(smallest) === -1) visited.push(smallest)
  }

  console.log({ distancesFromStartTo, previous, visited })
  return path.reverse()
}

console.log(wgraph.Dijkstra('A', 'E'))
