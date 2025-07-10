// Utility to build a partial tree containing:
// 1. The current node and its direct children.
// 2. The parent of the current node.
// 3. All previously processed nodes and their direct children.
// 4. The ancestors of all these visible nodes to maintain the tree structure.
// 5. No grandchildren or unrelated branches.
export function buildPartialTree(node, idsToInclude) {
  if (!node) {
    // console.log("[buildPartialTree] Node is null/undefined");
    return null;
  }

  // Ensure node ID is a string for consistent comparison
  const nodeId = node.id?.toString();
  if (!nodeId) {
    // console.log("[buildPartialTree] Node has no ID, skipping", node);
    return null;
  }

  const isIncluded = idsToInclude.has(nodeId);
  let relevantDescendantPaths = []; // These are children that are themselves included, or lead to included nodes.
  let hasAnyRelevantDescendant = false;
  const seenNodeIds = new Set(); // Track seen node IDs to prevent duplicates within this branch

  // console.log(`[buildPartialTree] Processing node: ${node.name} (ID: ${nodeId})`);

  if (node.children && Array.isArray(node.children)) {
    // console.log(`[buildPartialTree] Node ${nodeId} has ${node.children.length} children`);
    for (const child of node.children) {
      const recursivelyBuiltChild = buildPartialTree(child, idsToInclude);
      if (recursivelyBuiltChild) {
        // Check if we already have a node with this ID
        const childId = recursivelyBuiltChild.id?.toString();
        if (childId && seenNodeIds.has(childId)) {
          // console.log(`    [Duplicate Check] Skipping duplicate child: ${recursivelyBuiltChild.name} (ID: ${childId})`);
          continue; // Skip this duplicate
        }
        if (childId) {
          seenNodeIds.add(childId);
        }
        relevantDescendantPaths.push(recursivelyBuiltChild);
        hasAnyRelevantDescendant = true;
      }
    }
  }

  // If this node is included, or it's an ancestor to an included node, create a new node for the partial tree
  if (isIncluded || hasAnyRelevantDescendant) {
    // console.log(`[buildPartialTree] Node ${nodeId} is included or has relevant descendants.`);
    const newNode = { ...node, children: [] }; // Start with an empty children array

    // If this node is explicitly included, and has children, ensure those children are also included
    // by mapping them from the original `node.children` and applying the same logic.
    if (isIncluded) {
      // console.log(`[buildPartialTree] Node ${nodeId} is explicitly included.`);
      // If the node itself is included, its children should be either:
      //   - Recursively built children (if they are also included or ancestors to included nodes)
      //   - Or direct children with their own descendants pruned.
      newNode.children = (node.children || []).map(originalChild => {
        const matchedRelevantChild = relevantDescendantPaths.find(c => c.id === originalChild.id);
        if (matchedRelevantChild) {
          // This child is itself relevant (processed or leads to a processed node),
          // so include its full (partial) structure from recursion.
          // console.log(`    [Child Logic] Including recursive child: ${originalChild.name}`);
          return matchedRelevantChild;
        } else {
          // This direct child is NOT an ancestor to a processed node and not itself processed.
          // Include it, but prune its descendants (no grandchildren).
          // console.log(`    [Child Logic] Including direct child (pruned): ${originalChild.name}`);
          return { ...originalChild, children: [] };
        }
      }).filter(Boolean); // Filter out any nulls from duplicate checks
    } else {
      // This node is *not* explicitly included, and *not* the root.
      // It's an ancestor being included purely for structural integrity.
      // Its children should only be the ones that are themselves included or lead to included nodes.
      // console.log(`[buildPartialTree] Node ${nodeId} is an ancestor, not explicitly included.`);
      newNode.children = relevantDescendantPaths;
    }

    // console.log(`[buildPartialTree] Returning node ${nodeId} with ${newNode.children.length} children`);
    return newNode;
  }

  // console.log(`[buildPartialTree] Node ${nodeId} not included and has no relevant descendants, returning null.`);
  return null;
} 