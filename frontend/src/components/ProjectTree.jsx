import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";

const TreeNode = ({ node, level = 0 }) => {
  // Render simple text with indentation
  const indentation = "  ".repeat(level); // 2 spaces per level

  return (
    <div>
      <pre
        className="font-bold leading-tight mb-4"
        style={{ fontSize: "20px" }}
      >{`${indentation}[${node.nodeNumber || "1"}] ${node.name}`}</pre>
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

const ProjectTree = ({ projectId, username, projectname }) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  // Extracted loadProject function to be usable in multiple useEffect hooks.
  const loadProject = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}`);
      setTree(response.data);
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Listen for the custom "refreshProjectTree" event to reload the project.
  useEffect(() => {
    window.addEventListener("refreshProjectTree", loadProject);
    return () => {
      window.removeEventListener("refreshProjectTree", loadProject);
    };
  }, []);

  if (loading) return <div className="text-center p-4">Loading project...</div>;
  if (!tree) return <div className="text-center p-4">Project not found</div>;

  return (
    <div className="tree-container">
      <TreeNode node={tree} />
    </div>
  );
};

export default ProjectTree;
