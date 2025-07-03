import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";

const TreeNode = ({ node, level = 0, highlightedNodeId }) => {
  const indentation = "  ".repeat(level);

  const isHighlighted = node.id === highlightedNodeId;

  return (
    <div>
      <div
        className={`font-bold leading-none ${
          isHighlighted ? "bg-yellow-200 p-1 rounded" : ""
        }`}
        style={{
          fontSize: "28px",
        }}
      >{`${indentation}[${node.nodeNumber || "1"}] ${node.name}`}</div>
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
  const [tree, setTree] = useState(treeData || null);
  const [loading, setLoading] = useState(true);

  const loadProject = React.useCallback(async () => {
    setLoading(true);
    try {
      if (treeData) {
        setTree(treeData);
        setLoading(false);
        return;
      }
      const response = await axiosInstance.get(`/api/projects/${projectId}`);
      let fullTree = response.data;
      setTree(fullTree);
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId, treeData]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) return <div className="text-center p-4">Loading project...</div>;
  if (!tree) return <div className="text-center p-4">Project not found</div>;

  return (
    <div className="tree-container">
      <TreeNode node={tree} highlightedNodeId={highlightedNodeId} />
    </div>
  );
};

export default ProjectTree;
