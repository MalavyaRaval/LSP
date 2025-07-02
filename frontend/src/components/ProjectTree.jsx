import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";

const filterTree = (
  node,
  processedNodeIds,
  bfsQueue,
  currentParentId,
  parentIsVisible = false
) => {
  if (!node) {
    return null;
  }

  // Rule 1: Always include the root node.
  const isRoot = node.parent === undefined;

  // Rule 2: This node's decomposition is complete (it was a parent and its children were defined).
  const isProcessedParent = processedNodeIds.has(node.id?.toString());

  // Rule 3: This is the current node being processed.
  const isCurrentParent = node.id?.toString() === currentParentId?.toString();

  // A node is directly visible if it's the root, a processed parent, or the current parent.
  const isDirectlyVisible = isRoot || isProcessedParent || isCurrentParent;

  // A node is considered visible if it's directly visible OR its parent is visible.
  // This is crucial for showing children of processed nodes (including 'no decompose' nodes)
  // and for showing the path to a visible node.
  const nodeIsVisible = isDirectlyVisible || parentIsVisible;

  // Identify if this node is in the BFS queue but not the current node being processed, and is not yet marked as processed in the queue itself.
  const isInBfsQueueAndNotCurrent =
    bfsQueue.some((qNode) => qNode.id === node.id && !qNode.processed) &&
    !isCurrentParent;

  // --- DEBUGGING LOGS START ---
  console.log(`Filtering Node: ${node.name} (ID: ${node.id})`);
  console.log(`  isRoot: ${isRoot}`);
  console.log(`  isProcessedParent: ${isProcessedParent}`);
  console.log(
    `  isCurrentParent: ${isCurrentParent} (currentParentId: ${currentParentId})`
  );
  console.log(
    `  isInBfsQueueAndNotCurrent: ${isInBfsQueueAndNotCurrent} (bfsQueue: ${JSON.stringify(
      bfsQueue.map((n) => ({ id: n.id, processed: n.processed }))
    )})`
  );
  console.log(`  parentIsVisible: ${parentIsVisible}`);
  console.log(`  nodeIsVisible (after parentIsVisible): ${nodeIsVisible}`);
  // --- DEBUGGING LOGS END ---

  let filteredChildren = [];

  // Important: If the current node itself is a processed parent (isProcessedParent),
  // OR if its parent was visible (parentIsVisible), then ALL its children should be visible.
  // This is where "No" decompose nodes and children of previously processed nodes will be shown.
  if (node.children && node.children.length > 0) {
    if (isProcessedParent || parentIsVisible) {
      // If parent is processed/visible, all children are visible.
      // Filter them recursively, but ensure their parentIsVisible is true for them.
      filteredChildren = node.children
        .map((child) =>
          filterTree(
            child,
            processedNodeIds,
            bfsQueue,
            currentParentId,
            true // Force parentIsVisible to true for children of processed/visible parents
          )
        )
        .filter(Boolean);
    } else if (isCurrentParent) {
      // If it's the current parent, its immediate children are also visible.
      filteredChildren = node.children
        .map((child) =>
          filterTree(
            child,
            processedNodeIds,
            bfsQueue,
            currentParentId,
            true // Force parentIsVisible to true for children of current parent
          )
        )
        .filter(Boolean);
    } else if (isInBfsQueueAndNotCurrent) {
      // If it's a node in BFS queue (but not current and not processed), show the node but no children yet.
      // Children are filtered out by returning an empty array.
      filteredChildren = [];
    } else {
      // For any other case, recursively filter children normally.
      filteredChildren = node.children
        .map((child) =>
          filterTree(
            child,
            processedNodeIds,
            bfsQueue,
            currentParentId,
            nodeIsVisible // Pass down current node's visibility
          )
        )
        .filter(Boolean);
    }
  }

  // --- DEBUGGING LOGS START ---
  const shouldReturnNode =
    nodeIsVisible ||
    filteredChildren.length > 0 ||
    (isInBfsQueueAndNotCurrent && !isCurrentParent) ||
    isProcessedParent;
  console.log(`  filteredChildren length: ${filteredChildren.length}`);
  console.log(`  isProcessedParent (final check): ${isProcessedParent}`);
  console.log(`  Returning node: ${shouldReturnNode ? "Yes" : "No"}\n`);
  // --- DEBUGGING LOGS END ---

  // A node is included in the final tree if it's visible by its own right OR if any of its children are visible.
  // The `isInBfsQueueAndNotCurrent` also makes the node visible (but without children).
  // The added condition `isProcessedParent` here ensures that a processed parent is always returned,
  // even if it has no children or if `nodeIsVisible` was only true due to `parentIsVisible`.
  if (shouldReturnNode) {
    return { ...node, children: filteredChildren };
  }

  // If none of the conditions met, hide the node.
  return null;
};

const TreeNode = ({ node, level = 0 }) => {
  const indentation = "  ".repeat(level);

  return (
    <div>
      <div
        className="font-bold leading-none"
        style={{
          fontSize: "28px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >{`${indentation}[${node.nodeNumber || "1"}] ${node.name}`}</div>
      {node.children && node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectTree = ({
  projectId,
  processedNodes,
  bfsQueue,
  currentParentId,
}) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProject = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}`);
      let fullTree = response.data;

      const filteredTree = filterTree(
        fullTree,
        processedNodes,
        bfsQueue,
        currentParentId
      );
      setTree(filteredTree);
    } catch (error) {
      console.error("Error loading project:", error);
      // alert("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, processedNodes, bfsQueue, currentParentId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    window.addEventListener("refreshProjectTree", loadProject);
    return () => {
      window.removeEventListener("refreshProjectTree", loadProject);
    };
  }, [loadProject]);

  if (loading) return <div className="text-center p-4">Loading project...</div>;
  if (!tree) return <div className="text-center p-4">Project not found</div>;

  return (
    <div
      className="tree-container"
      style={{ overflowY: "auto", overflowX: "hidden" }}
    >
      <TreeNode node={tree} />
    </div>
  );
};

export default ProjectTree;
