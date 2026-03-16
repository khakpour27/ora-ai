import type { EnergyFlow } from "@/types";

/**
 * Validates that energy flows form a directed acyclic graph (DAG).
 * @nivo/sankey crashes on circular links — this prevents that.
 *
 * Returns null if valid, or the cycle path as an array of node IDs if invalid.
 */
export function findCycle(flows: EnergyFlow[]): string[] | null {
  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  for (const flow of flows) {
    if (!adj.has(flow.source)) adj.set(flow.source, new Set());
    if (!adj.has(flow.target)) adj.set(flow.target, new Set());
    adj.get(flow.source)!.add(flow.target);
  }

  // DFS cycle detection
  const white = new Set(adj.keys()); // unvisited
  const gray = new Set<string>(); // in current DFS path
  const parent = new Map<string, string>(); // for reconstructing cycle

  function dfs(node: string): string | null {
    white.delete(node);
    gray.add(node);

    const neighbors = adj.get(node);
    if (neighbors) {
      for (const next of neighbors) {
        if (gray.has(next)) {
          // Found a cycle — reconstruct path
          const cycle = [next, node];
          let curr = node;
          while (parent.has(curr) && parent.get(curr) !== next) {
            curr = parent.get(curr)!;
            cycle.push(curr);
          }
          cycle.push(next);
          return next;
        }
        if (white.has(next)) {
          parent.set(next, node);
          const result = dfs(next);
          if (result) return result;
        }
      }
    }

    gray.delete(node);
    return null;
  }

  for (const node of [...white]) {
    if (white.has(node)) {
      const cycleStart = dfs(node);
      if (cycleStart) {
        // Reconstruct the cycle path
        const path: string[] = [cycleStart];
        let curr = parent.get(cycleStart);
        while (curr && curr !== cycleStart) {
          path.push(curr);
          curr = parent.get(curr);
        }
        path.push(cycleStart);
        path.reverse();
        return path;
      }
    }
  }

  return null;
}

/**
 * Validate energy flows and return a human-readable error message.
 */
export function validateSankeyFlows(flows: EnergyFlow[]): string | null {
  const cycle = findCycle(flows);
  if (!cycle) return null;
  return `Sirkulaer referanse funnet: ${cycle.join(" → ")}. Sankey-diagrammet krever rettet asyklisk graf (DAG).`;
}
