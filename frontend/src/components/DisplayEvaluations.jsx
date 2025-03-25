import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// Helper: recursively extract leaf nodes (nodes with no children)
const getLeafNodes = (node) => {
  if (!node.children || node.children.length === 0) return [node];
  let leaves = [];
  node.children.forEach((child) => {
    leaves = leaves.concat(getLeafNodes(child));
  });
  return leaves;
};

const DisplayEvaluations = () => {
  const { projectname } = useParams(); // using projectname as project ID
  const [evaluations, setEvaluations] = useState([]);
  const [leafMapping, setLeafMapping] = useState({}); // map from project tree: leafId -> leafName
  const [queryMapping, setQueryMapping] = useState({}); // fallback mapping from query results: nodeId -> nodeName
  const [error, setError] = useState("");

  // Fetch evaluations.
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/evaluations?project=${projectname}`
        );
        setEvaluations(res.data);
      } catch (err) {
        console.error("Error fetching evaluations:", err);
        setError("Failed to fetch evaluations.");
      }
    };
    fetchEvaluations();
  }, [projectname]);

  // Fetch the project tree to build leaf id-name mapping.
  useEffect(() => {
    const fetchProjectTree = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/projects/${projectname}`
        );
        const treeData = res.data;
        const leaves = getLeafNodes(treeData);
        const mapping = {};
        leaves.forEach((leaf) => {
          // Use string conversion for consistent lookup.
          mapping[leaf.id.toString()] = leaf.name;
        });
        setLeafMapping(mapping);
      } catch (err) {
        console.error("Error fetching project tree:", err);
      }
    };
    fetchProjectTree();
  }, [projectname]);

  // Fetch query results to build fallback mapping from nodeId to nodeName.
  useEffect(() => {
    const fetchQueryResultsMapping = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/queryResults?project=${projectname}`
        );
        const mapping = {};
        res.data.forEach((result) => {
          mapping[result.nodeId.toString()] = result.nodeName;
        });
        setQueryMapping(mapping);
      } catch (err) {
        console.error("Error fetching query results for mapping:", err);
      }
    };
    fetchQueryResultsMapping();
  }, [projectname]);

  // Compute union of all keys in alternativeValues from evaluations.
  const allLeafKeys = evaluations.reduce((acc, evalItem) => {
    const keys = Object.keys(evalItem.alternativeValues || {});
    keys.forEach((key) => {
      if (!acc.includes(key)) {
        acc.push(key);
      }
    });
    return acc;
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h1 className="text-2xl font-bold mb-4">Alternatives Comparision</h1>
      {error && <p className="text-red-500">{error}</p>}
      {!error && evaluations.length === 0 && <p>No evaluations found.</p>}
      {evaluations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                {/* First column header:Attribute name */}
                <th className="border border-gray-300 p-2">Attribute</th>
                {/* Each evaluation becomes a column */}
                {evaluations.map((evalItem) => (
                  <th key={evalItem._id} className="border border-gray-300 p-2">
                    {evalItem.alternativeName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row for Cost */}
              {/* <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2 font-medium">Cost</td>
                {evaluations.map((evalItem) => (
                  <td key={evalItem._id} className="border border-gray-300 p-2">
                    {evalItem.alternativeCost}
                  </td>
                ))}
              </tr> */}
              {/* Row for each leaf key */}
              {allLeafKeys.map((key) => {
                // Use project tree mapping first, then fallback to query mapping.
                const leafLabel =
                  leafMapping[key.toString()] ||
                  queryMapping[key.toString()] ||
                  `Leaf ${key}`;
                return (
                  <tr key={key} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2 font-medium">
                      {leafLabel}
                    </td>
                    {evaluations.map((evalItem) => (
                      <td
                        key={evalItem._id}
                        className="border border-gray-300 p-2"
                      >
                        {evalItem.alternativeValues &&
                        evalItem.alternativeValues[key] !== undefined
                          ? evalItem.alternativeValues[key]
                          : "-"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DisplayEvaluations;
