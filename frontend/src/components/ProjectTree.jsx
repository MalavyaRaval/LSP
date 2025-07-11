import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";

const TreeNode = ({ node, level = 0, highlightedNodeId }) => {
  const indentation = "  ".repeat(level);

  const isHighlighted = node.id === highlightedNodeId;

  // Additional safety check: ensure node has required properties
  if (!node || !node.id || !node.name) {
    return null;
  }

  return (
    <div>
      <div
        className={`font-bold leading-none text-indigo-700`}
        style={{
          fontSize: "28px",
          fontFamily: "Arial Narrow",
          ...(isHighlighted
            ? {
                backgroundColor: "#FEF3C7",
                padding: "0.25rem",
                borderRadius: "0.25rem",
              }
            : {}),
        }}
      >{`${indentation}${node.nodeNumber || "1"} ${node.name}`}</div>
      {node.children && node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              highlightedNodeId={highlightedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectTree = ({ projectId, treeData, highlightedNodeId }) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to clean and deduplicate the entire tree structure
  const cleanTreeStructure = (node, seenIds = new Set(), path = []) => {
    if (!node) {
      // console.log("cleanTreeStructure: Node is null/undefined");
      return null;
    }

    // Create a unique identifier for this node
    const nodeId = node.id?.toString();
    if (!nodeId) {
      // console.log("cleanTreeStructure: Node has no ID, skipping", node);
      return null;
    }

    // console.log(
    //   `cleanTreeStructure: Processing node ${nodeId} (${
    //     node.name
    //   }) at path: ${path.join(" -> ")}`
    // );

    // If we've already processed this node ID, return null to skip it
    if (seenIds.has(nodeId)) {
      // console.log(
      //   "cleanTreeStructure: Skipping duplicate node with ID:",
      //   nodeId,
      //   "name:",
      //   node.name
      // );
      return null;
    }

    // Add this node's ID to the seen set
    seenIds.add(nodeId);

    // Clean the children array and ensure no duplicates within children
    const cleanedChildren = [];
    const childSeenIds = new Set(); // Track seen IDs within this node's children

    if (node.children && Array.isArray(node.children)) {
      // console.log(
      //   `cleanTreeStructure: Node ${nodeId} has ${node.children.length} children`
      // );
      node.children.forEach((child, index) => {
        const childId = child.id?.toString();

        // Skip if this child ID has already been seen within this node's children
        if (childId && childSeenIds.has(childId)) {
          // console.log(
          //   `cleanTreeStructure: Skipping duplicate child within node ${nodeId}:`,
          //   child.name,
          //   "(ID:",
          //   childId,
          //   ")"
          // );
          return;
        }

        if (childId) {
          childSeenIds.add(childId);
        }

        const cleanedChild = cleanTreeStructure(child, seenIds, [
          ...path,
          node.name || nodeId,
        ]);
        if (cleanedChild) {
          cleanedChildren.push(cleanedChild);
        }
      });
    }

    // Return the cleaned node
    const result = {
      ...node,
      children: cleanedChildren,
    };

    // console.log(
    //   `cleanTreeStructure: Returning node ${nodeId} with ${cleanedChildren.length} children`
    // );
    return result;
  };

  // Function to validate and clean tree data
  const validateAndCleanTree = (rawTree) => {
    if (!rawTree) {
      // console.log("validateAndCleanTree: No raw tree data provided");
      return null;
    }

    // console.log("validateAndCleanTree: Starting with raw tree", rawTree);
    // console.log("validateAndCleanTree: Raw tree has ID:", rawTree.id);
    // console.log("validateAndCleanTree: Raw tree has name:", rawTree.name);
    // console.log(
    //   "validateAndCleanTree: Raw tree has children:",
    //   rawTree.children?.length || 0
    // );

    // Create a fresh Set for this cleaning operation
    const seenIds = new Set();
    const cleanedTree = cleanTreeStructure(rawTree, seenIds);

    // console.log("validateAndCleanTree: Cleaned tree", cleanedTree);
    // console.log(
    //   "validateAndCleanTree: Total unique nodes processed:",
    //   seenIds.size
    // );

    return cleanedTree;
  };

  const loadProject = React.useCallback(async () => {
    setLoading(true);
    try {
      let rawTree;

      if (treeData) {
        // console.log("ProjectTree: Using provided treeData", treeData);
        rawTree = treeData;
      } else {
        // Add cache busting parameter to force fresh data
        // console.log(
        //   "ProjectTree: Fetching data from API for project:",
        //   projectId
        // );
        const response = await axiosInstance.get(
          `/api/projects/${projectId}?t=${Date.now()}`
        );
        rawTree = response.data;
        // console.log("ProjectTree: Raw data from API", rawTree);
      }

      // Clean the tree to remove any duplicates that might still exist
      // console.log("ProjectTree: Cleaning tree data to remove duplicates");
      const cleanedTree = validateAndCleanTree(rawTree);
      // console.log("ProjectTree: Cleaned tree data set to state:", cleanedTree);
      setTree(cleanedTree);
    } catch (error) {
      // console.error("Error loading project:", error);
      alert("Failed to load project");
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, treeData, refreshKey]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Reset tree when projectId changes
  useEffect(() => {
    setTree(null);
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  }, [projectId]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      // console.log("ProjectTree: Refresh event received");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("refreshProjectTree", handleRefresh);
    return () => {
      window.removeEventListener("refreshProjectTree", handleRefresh);
    };
  }, []);

  if (loading) return <div className="text-center p-4">Loading project...</div>;
  if (!tree) return <div className="text-center p-4">Project not found</div>;

  // console.log("ProjectTree: Component is rendering");
  return (
    <div
      className="tree-container"
      key={refreshKey}
      style={{ fontFamily: "Arial Narrow" }}
    >
      <TreeNode node={tree} highlightedNodeId={highlightedNodeId} />
    </div>
  );
};

export default ProjectTree;
