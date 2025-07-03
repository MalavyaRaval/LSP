// Utility to build a partial tree containing:
// 1. The current node and its direct children.
// 2. The parent of the current node.
// 3. All previously processed nodes and their direct children.
// 4. The ancestors of all these visible nodes to maintain the tree structure.
// 5. No grandchildren or unrelated branches.
export function buildPartialTree(node, idsToInclude) {
  if (!node) {
    return null;
  }

  const nodeId = node.id?.toString();
  const isExplicitlyIncluded = idsToInclude.has(nodeId);
  const isRoot = node.parent === undefined || node.parent === null;

  let relevantDescendantPaths = []; // These are children that are themselves included, or lead to included nodes.
  let hasAnyRelevantDescendant = false;

  console.log(`[buildPartialTree] Processing node: ${node.name} (ID: ${nodeId})`);
  console.log(`  isExplicitlyIncluded: ${isExplicitlyIncluded}`);
  console.log(`  isRoot: ${isRoot}`);
  console.log(`  idsToInclude:`, Array.from(idsToInclude));

  // Step 1: Recursively build the partial tree for children.
  // This identifies which children are themselves relevant or lead to relevant nodes.
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
      const recursivelyBuiltChild = buildPartialTree(child, idsToInclude);
      if (recursivelyBuiltChild) {
        relevantDescendantPaths.push(recursivelyBuiltChild);
        hasAnyRelevantDescendant = true;
      }
    });
  }

  console.log(`  hasAnyRelevantDescendant (after children recursion): ${hasAnyRelevantDescendant}`);
  console.log(`  relevantDescendantPaths (after children recursion):`, relevantDescendantPaths.map(n => n.name));

  // Step 2: Determine if this current node should be part of the final partial tree.
  // It's included if it's explicitly marked, it's the root, or if it's an ancestor to a relevant child.
  if (isExplicitlyIncluded || isRoot || hasAnyRelevantDescendant) {
    const newNode = { ...node };

    if (isExplicitlyIncluded || isRoot) {
      // If this node is explicitly included (or root), we want to show ALL its direct children.
      // For each direct child:
      //   - If it's *also* a relevant child found in recursion (meaning it's processed or leads to a processed node),
      //     use its recursively built structure (which already has its children pruned if it's a direct processed node).
      //   - Otherwise, just include the direct child but ensure its own children are empty (no grandchildren).
      newNode.children = (node.children || []).map(originalChild => {
        const matchedRelevantChild = relevantDescendantPaths.find(c => c.id === originalChild.id);
        if (matchedRelevantChild) {
          // This child is itself relevant (processed or leads to a processed node),
          // so include its full (partial) structure from recursion.
          console.log(`    [Child Logic] Including recursive child: ${originalChild.name}`);
          return matchedRelevantChild;
        } else {
          // This direct child is NOT an ancestor to a processed node and not itself processed.
          // Include it, but prune its descendants (no grandchildren).
          console.log(`    [Child Logic] Including direct child (pruned): ${originalChild.name}`);
          return { ...originalChild, children: [] };
        }
      });
    } else {
      // This node is *not* explicitly included, and *not* the root.
      // It's only included because it's an ancestor to a relevant node.
      // So, its children should only be the `relevantDescendantPaths` (the relevant branches).
      console.log(`  [Node Logic] Including as ancestor, children are:`, relevantDescendantPaths.map(n => n.name));
      newNode.children = relevantDescendantPaths;
    }

    console.log(`[buildPartialTree] Returning node: ${node.name} with children:`, newNode.children.map(c => c.name));
    return newNode;
  }

  // If none of the conditions met, this node is not relevant to the partial tree.
  console.log(`[buildPartialTree] Pruning node: ${node.name}`);
  return null;
} 