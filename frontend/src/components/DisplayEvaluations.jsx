import { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";
import { useParams } from "react-router-dom";
import {
  scoreIncreasing,
  scoreDecreasing,
  scoreInRange,
} from "./utils/satisfactionCalculator";
import { calculateAlternativeSatisfactions } from "./utils/parentCalculation";
import Navbar from "./Nav/Navbar";

// Helper: recursively get all nodes in tree order
const getAllNodesInOrder = (node, nodesList = []) => {
  if (!node) return nodesList;

  nodesList.push({
    id: node.id,
    name: node.name,
    nodeNumber: node.nodeNumber || "1",
    importance: node.attributes?.importance,
    connection: node.attributes?.connection,
  });

  if (node.children) {
    node.children.forEach((child) => getAllNodesInOrder(child, nodesList));
  }

  return nodesList;
};

// Helper: recursively extract leaf nodes (nodes with no children)
const getLeafNodes = (node) => {
  if (!node.children || node.children.length === 0) return [node];
  let leaves = [];
  node.children.forEach((child) => {
    leaves = leaves.concat(getLeafNodes(child));
  });
  return leaves;
};

// Helper: Convert connection value to display label
const getConnectionLabel = (value) => {
  const connectionMap = {
    4: "A",
    1: "SC-",
    2: "SC",
    3: "SC+",
    5: "HC-",
    6: "HC",
    7: "HC+",
    8: "HC++",
    "-1": "SD-",
    "-2": "SD",
    "-3": "SD+",
    "-5": "HD-",
    "-6": "HD",
    "-7": "HD+",
    "-8": "HD++",
  };

  return connectionMap[value?.toString()] || value || "-";
};

const DisplayEvaluations = () => {
  const { projectname } = useParams();
  const [evaluations, setEvaluations] = useState([]);
  const [leafMapping, setLeafMapping] = useState({});
  const [queryMapping, setQueryMapping] = useState({});
  const [error, setError] = useState("");
  const [projectTree, setProjectTree] = useState(null);
  const [queryDetails, setQueryDetails] = useState({});
  const [nodeDetails, setNodeDetails] = useState({});
  const [allNodes, setAllNodes] = useState([]);
  const [allSatisfactions, setAllSatisfactions] = useState({}); // Store satisfactions for all alternatives

  // Fetch evaluations.
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/evaluations?project=${projectname}`
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
        const res = await axiosInstance.get(`/api/projects/${projectname}`);
        const treeData = res.data;
        setProjectTree(treeData);

        // Get all nodes in tree order
        const nodes = getAllNodesInOrder(treeData);
        setAllNodes(nodes);

        // Extract and store node details (nodeNumber, importance, connection)
        const nodeDetailsMap = {};
        const extractNodeDetails = (node) => {
          nodeDetailsMap[node.id.toString()] = {
            nodeNumber: node.nodeNumber || "1",
            importance: node.attributes?.importance,
            connection: node.attributes?.connection,
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
        const res = await axiosInstance.get(
          `/api/queryResults?project=${projectname}`
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

  // Calculate all satisfactions when data is ready
  useEffect(() => {
    if (
      evaluations.length > 0 &&
      projectTree &&
      Object.keys(queryDetails).length > 0 &&
      allNodes.length > 0
    ) {
      const satisfactionsMap = {};

      evaluations.forEach((evalItem) => {
        const alternativeSatisfactions = calculateAlternativeSatisfactions(
          allNodes,
          evalItem.alternativeValues,
          queryDetails,
          calculateSatisfaction,
          projectTree
        );
        satisfactionsMap[evalItem._id] = alternativeSatisfactions;
      });

      setAllSatisfactions(satisfactionsMap);
    }
  }, [evaluations, projectTree, queryDetails, allNodes]);

  // Format query values for display
  const getQueryValuesDisplay = (nodeId) => {
    const queryInfo = queryDetails[nodeId];
    if (!queryInfo) return "-";

    const values = queryInfo.values;
    if (!values) return "-";
    if (queryInfo.queryType === "q4") {
      const hasSpecificPoints =
        values.specificPoints && values.specificPoints.length > 0;
      return `Prefer high values: ${values.from} to ${values.to}${
        hasSpecificPoints
          ? ` (${values.specificPoints.length} custom points)`
          : ""
      }`;
    } else if (queryInfo.queryType === "q5") {
      const hasSpecificPoints =
        values.specificPoints && values.specificPoints.length > 0;
      return `Prefer low values: ${values.from} to ${values.to}${
        hasSpecificPoints
          ? ` (${values.specificPoints.length} custom points)`
          : ""
      }`;
    } else if (queryInfo.queryType === "q6") {
      return `Acceptance range: A=${values.A}, B=${values.B}, C=${values.C}, D=${values.D}`;
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
        const specificPoints = values.specificPoints || [];

        satisfaction = scoreIncreasing(numValue, min, max, specificPoints);
      } else if (queryType === "q5") {
        const min = Number(values.from);
        const max = Number(values.to);
        const specificPoints = values.specificPoints || [];

        satisfaction = scoreDecreasing(numValue, min, max, specificPoints);
      } else if (queryType === "q6") {
        const A = Number(values.A);
        const B = Number(values.B);
        const C = Number(values.C);
        const D = Number(values.D);
        satisfaction = scoreInRange(numValue, A, B, C, D);
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
    <>
      <Navbar />
      <div className="p-6 bg-white rounded-lg shadow-md mx-4">
        <h1 className="text-2xl font-bold mb-4">Project Evaluation Analysis</h1>
        {error && <p className="text-red-500">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-gray-300 p-2">Node #</th>
                <th className="border border-gray-300 p-2">Node Name</th>
                <th className="border border-gray-300 p-2">Importance</th>
                <th className="border border-gray-300 p-2">Connection</th>
                <th className="border border-gray-300 p-2">Query Type</th>
                <th className="border border-gray-300 p-2">Criteria</th>
                {evaluations.map((evalItem) => (
                  <th key={evalItem._id} className="border border-gray-300 p-2">
                    {evalItem.alternativeName}
                  </th>
                ))}
                {evaluations.map((evalItem) => (
                  <th
                    key={`${evalItem._id}-satisfaction`}
                    className="border border-gray-300 p-2 bg-blue-50"
                  >
                    {evalItem.alternativeName} Satisfaction
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Cost Row */}
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2 font-medium">Cost</td>
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2">-</td>
                {evaluations.map((evalItem) => (
                  <td key={evalItem._id} className="border border-gray-300 p-2">
                    {evalItem.alternativeCost}
                  </td>
                ))}
                {evaluations.map((evalItem) => (
                  <td
                    key={`${evalItem._id}-satisfaction`}
                    className="border border-gray-300 p-2 bg-blue-50"
                  >
                    -
                  </td>
                ))}
              </tr>

              {/* All Nodes Rows */}
              {allNodes.map((node) => {
                const isLeaf = allLeafKeys.includes(node.id.toString());
                const query = queryDetails[node.id.toString()];

                return (
                  <tr key={node.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2">
                      {node.nodeNumber}
                    </td>
                    <td className="border border-gray-300 p-2">{node.name}</td>
                    <td className="border border-gray-300 p-2">
                      {node.importance || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {getConnectionLabel(node.connection)}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {isLeaf && query ? query.queryType.toUpperCase() : "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {isLeaf ? getQueryValuesDisplay(node.id.toString()) : "-"}
                    </td>
                    {evaluations.map((evalItem) => (
                      <td
                        key={evalItem._id}
                        className="border border-gray-300 p-2"
                      >
                        {isLeaf
                          ? evalItem.alternativeValues &&
                            evalItem.alternativeValues[node.id] !== undefined
                            ? evalItem.alternativeValues[node.id]
                            : "-"
                          : "-"}
                      </td>
                    ))}
                    {evaluations.map((evalItem) => (
                      <td
                        key={`${evalItem._id}-satisfaction`}
                        className="border border-gray-300 p-2 bg-blue-50"
                      >
                        {(() => {
                          const satisfaction = allSatisfactions[evalItem._id]
                            ? allSatisfactions[evalItem._id][node.id.toString()]
                            : null;

                          return satisfaction !== null &&
                            satisfaction !== undefined ? (
                            <>
                              {`${(satisfaction * 100).toFixed(2)}%`}
                              <SatisfactionBar percentage={satisfaction} />
                            </>
                          ) : (
                            "-"
                          );
                        })()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DisplayEvaluations;
