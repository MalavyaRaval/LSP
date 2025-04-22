import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  scoreIncreasing,
  scoreDecreasing,
  scoreInRange,
} from "./utils/satisfactionCalculator";

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
  const [projectTree, setProjectTree] = useState(null); // Store the complete tree
  const [queryDetails, setQueryDetails] = useState({}); // Store query details like type and values
  const [nodeDetails, setNodeDetails] = useState({}); // Store node details like nodeNumber

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
        setProjectTree(treeData); // Store the complete tree

        // Extract and store node details (nodeNumber only)
        const nodeDetailsMap = {};
        const extractNodeDetails = (node) => {
          nodeDetailsMap[node.id.toString()] = {
            nodeNumber: node.nodeNumber || "1",
          };

          if (node.children && node.children.length > 0) {
            node.children.forEach((child) => extractNodeDetails(child));
          }
        };

        extractNodeDetails(treeData);
        setNodeDetails(nodeDetailsMap);

        // Continue with leaf mapping as before
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

  // Fetch query results to build fallback mapping and get query details
  useEffect(() => {
    const fetchQueryResultsMapping = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/queryResults?project=${projectname}`
        );
        const mapping = {};
        const queryDetailsMap = {};

        res.data.forEach((result) => {
          mapping[result.nodeId.toString()] = result.nodeName;

          // Store query type and values for each node
          queryDetailsMap[result.nodeId.toString()] = {
            queryType: result.queryType,
            values: result.values,
          };
        });

        setQueryMapping(mapping);
        setQueryDetails(queryDetailsMap);
      } catch (err) {
        console.error("Error fetching query results for mapping:", err);
      }
    };
    fetchQueryResultsMapping();
  }, [projectname]);

  // Format query values for display
  const getQueryValuesDisplay = (nodeId) => {
    const queryInfo = queryDetails[nodeId];
    if (!queryInfo) return "-";

    const values = queryInfo.values;
    if (!values) return "-";

    if (queryInfo.queryType === "q4") {
      return `Prefer high values: ${values.from} to ${values.to}`;
    } else if (queryInfo.queryType === "q5") {
      return `Prefer low values: ${values.from} to ${values.to}`;
    } else if (queryInfo.queryType === "q6") {
      return `Acceptance range: A=${values.A}, B=${values.B}, C=${values.C}, D=${values.D}`;
    } else if (queryInfo.queryType === "q7") {
      return `Custom table: ${values.from} to ${values.to}`;
    } else if (queryInfo.queryType === "q13") {
      return `Suitability: ${values.suitabilityLabel} (${values.suitabilityValue}%)`;
    }
    return JSON.stringify(values);
  };

  // Calculate satisfaction percentage based on query type and value
  const calculateSatisfaction = (nodeId, value) => {
    const queryInfo = queryDetails[nodeId];
    if (!queryInfo || value === "-" || value === undefined) return null;

    const queryType = queryInfo.queryType;
    const values = queryInfo.values;
    let satisfaction = 0;

    try {
      // Convert value to number
      const numValue = Number(value);

      if (isNaN(numValue)) return null;

      if (queryType === "q4") {
        const min = Number(values.from);
        const max = Number(values.to);
        satisfaction = scoreIncreasing(numValue, min, max);
      } else if (queryType === "q5") {
        const min = Number(values.from);
        const max = Number(values.to);
        satisfaction = scoreDecreasing(numValue, min, max);
      } else if (queryType === "q6") {
        // Use all four values A, B, C, D for Q6
        const A = Number(values.A);
        const B = Number(values.B);
        const C = Number(values.C);
        const D = Number(values.D);
        satisfaction = scoreInRange(numValue, A, B, C, D);
      } else if (queryType === "q7") {
        const min = Number(values.from);
        const max = Number(values.to);
        satisfaction = scoreIncreasing(numValue, min, max);
      } else if (queryType === "q13") {
        satisfaction = numValue / 100;
      }

      satisfaction = Math.max(0, Math.min(1, satisfaction));
      return satisfaction;
    } catch (error) {
      console.error("Error calculating satisfaction:", error);
      return null;
    }
  };

  // Component for satisfaction bar
  const SatisfactionBar = ({ percentage }) => {
    if (percentage === null) return null;

    const barWidth = `${Math.round(percentage * 100)}%`;
    const barColor = (() => {
      if (percentage < 0.3) return "bg-red-500";
      if (percentage < 0.7) return "bg-yellow-500";
      return "bg-green-500";
    })();

    return (
      <div className="mt-1">
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div
            className={`h-2 rounded-full ${barColor}`}
            style={{ width: barWidth }}
          ></div>
        </div>
        <div className="text-xs text-gray-600 text-right">
          {Math.round(percentage * 100)}%
        </div>
      </div>
    );
  };

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
      <h1 className="text-2xl font-bold mb-4">Alternatives Comparison</h1>
      {error && <p className="text-red-500">{error}</p>}
      {!error && evaluations.length === 0 && <p>No evaluations found.</p>}
      {evaluations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                {/* Attribute details columns */}
                <th className="border border-gray-300 p-2">Node #</th>
                <th className="border border-gray-300 p-2">Attribute</th>
                <th className="border border-gray-300 p-2">Query Type</th>
                <th className="border border-gray-300 p-2">Criteria</th>
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
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2 font-medium">-</td>
                <td className="border border-gray-300 p-2 font-medium">Cost</td>
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2">-</td>
                {evaluations.map((evalItem) => (
                  <td key={evalItem._id} className="border border-gray-300 p-2">
                    {evalItem.alternativeCost}
                  </td>
                ))}
              </tr>
              {/* Row for each leaf key */}
              {allLeafKeys.map((key) => {
                // Use project tree mapping first, then fallback to query mapping.
                const leafLabel =
                  leafMapping[key.toString()] ||
                  queryMapping[key.toString()] ||
                  `Leaf ${key}`;

                // Get node details
                const node = nodeDetails[key.toString()] || {};
                const query = queryDetails[key.toString()];

                return (
                  <tr key={key} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2 font-medium">
                      {node.nodeNumber || "-"}
                    </td>
                    <td className="border border-gray-300 p-2 font-medium">
                      {leafLabel}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {query ? query.queryType.toUpperCase() : "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {getQueryValuesDisplay(key.toString())}
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
                        <SatisfactionBar
                          percentage={calculateSatisfaction(
                            key.toString(),
                            evalItem.alternativeValues
                              ? evalItem.alternativeValues[key]
                              : "-"
                          )}
                        />
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
