// src/components/Validation.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";

// Helper function to flatten the tree into an array (excluding the root)
const flattenTree = (node) => {
  let nodes = [];
  // Only include nodes that have a parent and at least one child
  if (node.parent !== null && node.children && node.children.length > 0) {
    nodes.push(node);
  }
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      nodes = nodes.concat(flattenTree(child));
    });
  }
  return nodes;
};

const Validation = () => {
  const { username, projectname } = useParams();
  const projectId = projectname
    ? projectname
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
    : null;

  const [treeData, setTreeData] = useState(null);
  const [flatNodes, setFlatNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const response = await axiosInstance.get(`/api/projects/${projectId}`);
        setTreeData(response.data);
        const flattened = flattenTree(response.data);
        setFlatNodes(flattened);
      } catch (err) {
        setError("Error fetching project tree");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTree();
    } else {
      setError("Invalid project name");
      setLoading(false);
    }
  }, [projectId]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Validation</h2>
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border">Child Name</th>
            <th className="px-4 py-2 border">Importance</th>
            <th className="px-4 py-2 border">Connection</th>
          </tr>
        </thead>
        <tbody>
          {flatNodes.map((node) => (
            <tr key={node.id} className="text-center">
              <td className="border px-4 py-2">{node.name}</td>
              <td className="border px-4 py-2">
                {node.attributes?.importance ?? "-"}
              </td>
              <td className="border px-4 py-2">
                {node.attributes?.connection ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Validation;
