import { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
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
    partialabsorption: node.attributes?.partialabsorption,
    penaltyreward: node.attributes?.penaltyreward,
  });

  if (node.children) {
    node.children.forEach((child) => getAllNodesInOrder(child, nodesList));
  }

  return nodesList;
};

// Helper function to convert penalty/reward values back to impact level
const getImpactLevelFromValues = (penaltyreward) => {
  if (!penaltyreward) return "Not Set";

  const { penalty, reward } = penaltyreward;

  // Match against predefined mappings
  if (penalty <= 0.1 && reward <= 0.05) return "Low";
  if (penalty <= 0.2 && reward <= 0.1) return "Medium";
  if (penalty <= 0.3 && reward <= 0.15) return "High";

  // For custom values, show the raw numbers
  return `Custom (P:${penalty}, R:${reward})`;
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

const DisplayEvaluations = () => {
  const { projectname } = useParams();
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [leafMapping, setLeafMapping] = useState({});
  const [queryMapping, setQueryMapping] = useState({});
  const [error, setError] = useState("");
  const [projectTree, setProjectTree] = useState(null);
  const [queryDetails, setQueryDetails] = useState({});
  const [nodeDetails, setNodeDetails] = useState({});
  const [allNodes, setAllNodes] = useState([]);
  const [allSatisfactions, setAllSatisfactions] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch evaluations.
  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/evaluations?project=${projectname}&_=${new Date().getTime()}`
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
          `/api/queryResults?project=${projectname}&_=${new Date().getTime()}`
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

  // Handle delete evaluation
  const handleDeleteEvaluation = async (evaluationId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this competitor? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await axiosInstance.delete(
        `/api/evaluations/${evaluationId}`
      );
      // Remove from local state using the returned deletedEvaluation._id
      setEvaluations((prev) =>
        prev.filter((e) => e._id !== res.data.deletedEvaluation._id)
      );
      setShowDeleteModal(false);
      setSelectedEvaluation(null);
      alert("Competitor deleted successfully.");
    } catch (err) {
      console.error("Error deleting evaluation:", err);
      setError("Failed to delete competitor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle modify evaluation
  const handleModifyEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowModifyModal(false);
    navigate(`/project/${projectname}/evaluation/${evaluation._id}/modify`);
  };

  // Format query values for display
  const getQueryValuesDisplay = (nodeId) => {
    const queryInfo = queryDetails[nodeId];
    if (!queryInfo) return "-";

    const values = queryInfo.values;
    if (!values) return "-";
    if (queryInfo.queryType === "q4") {
      // Q4: Prefer high values
      return (
        <>
          <div>
            Range: {values.from}-{values.to}
          </div>
          <div>preferred high values</div>
        </>
      );
    } else if (queryInfo.queryType === "q5") {
      // Q5: Prefer low values
      return (
        <>
          <div>
            Range: {values.from}-{values.to}
          </div>
          <div>preferred low values</div>
        </>
      );
    } else if (queryInfo.queryType === "q6") {
      // Q6: Range: a, (b, c), d and preferred range b-c
      return (
        <>
          <div>
            Range: {values.A}, ({values.B}, {values.C}), {values.D}
          </div>
          <div>
            preferred range {values.B}-{values.C}
          </div>
        </>
      );
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
      if (percentage < 0.33) return "bg-red-500";
      if (percentage < 0.67) return "bg-yellow-500";
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
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate("/home")}
            className="text-lg font-extrabold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            <span style={{ fontSize: "1.5rem" }}>Back to Home</span>
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => navigate(`/project/${projectname}/evaluation/new`)}
              className="text-lg font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontSize: "1.5rem" }}>Add Competitor</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-lg font-extrabold bg-gradient-to-r from-red-500 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontSize: "1.5rem" }}>Delete Competitor</span>
            </button>
            <button
              onClick={() => setShowModifyModal(true)}
              className="text-lg font-extrabold bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontSize: "1.5rem" }}>Modify Competitor</span>
            </button>
          </div>
        </div>
        {error && <p className="text-red-500">{error}</p>}

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-700">
            <thead className="bg-gray-200">
              <tr>
                {/* <th className="border border-gray-300 p-2">Node #</th> */}
                <th className="border border-gray-700 p-2">Component Name</th>
                {/* <th className="border border-gray-300 p-2">Importance</th>
                <th className="border border-gray-300 p-2">Connection</th>
                <th className="border border-gray-300 p-2">Partial Absorption</th>
                <th className="border border-gray-300 p-2">Impact Level</th>
                <th className="border border-gray-300 p-2">Query Type</th> */}
                <th className="border border-gray-700 p-2">
                  Attribute Criteria
                </th>
                {evaluations.map((evalItem) => (
                  <th key={evalItem._id} className="border border-gray-700 p-2">
                    {evalItem.alternativeName.length > 15
                      ? `${evalItem.alternativeName.slice(0, 10)}...`
                      : evalItem.alternativeName}
                  </th>
                ))}
                {evaluations.map((evalItem) => (
                  <th
                    key={`${evalItem._id}-satisfaction`}
                    className="border border-gray-700 p-2 bg-blue-50"
                  >
                    {evalItem.alternativeName.length > 15
                      ? `${evalItem.alternativeName.slice(0, 10)}...`
                      : evalItem.alternativeName}{" "}
                    Suitability
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Cost Row */}
              {/*
              <tr className="hover:bg-gray-100">
                <td className="border border-gray-300 p-2">-</td>
                <td className="border border-gray-300 p-2 font-medium">Cost</td>
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
              */}
              {/* All Nodes Rows */}
              {allNodes.map((node, idx) => {
                const isLeaf = allLeafKeys.includes(node.id.toString());
                const query = queryDetails[node.id.toString()];
                const isFirstRow = idx === 0;

                return (
                  <tr
                    key={node.id}
                    className={`hover:bg-gray-100 ${
                      isFirstRow
                        ? "bg-blue-100 font-bold text-lg border-2 border-blue-400 shadow-md"
                        : ""
                    }`}
                  >
                    {/* <td className="border border-gray-300 p-2">
                      {node.nodeNumber}
                    </td> */}
                    <td
                      className={`border border-gray-700 p-2 ${
                        isFirstRow ? "text-blue-900" : ""
                      }`}
                    >
                      {node.name}
                    </td>
                    {/* <td className="border border-gray-300 p-2">
                      {node.importance || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {node.connection || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {node.partialabsorption || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {getImpactLevelFromValues(node.penaltyreward)}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {isLeaf && query ? query.queryType.toUpperCase() : "-"}
                    </td> */}
                    <td
                      className={`border border-gray-700 p-2 ${
                        isFirstRow ? "text-blue-900" : ""
                      }`}
                    >
                      {isLeaf ? getQueryValuesDisplay(node.id.toString()) : "-"}
                    </td>
                    {evaluations.map((evalItem) => (
                      <td
                        key={evalItem._id}
                        className={`border border-gray-700 p-2 ${
                          isFirstRow ? "text-blue-900" : ""
                        }`}
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
                        className={`border border-gray-700 p-2 bg-blue-50 ${
                          isFirstRow ? "text-blue-900" : ""
                        }`}
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

      {/* Delete Competitor Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Competitor</h2>
            <p className="mb-4 text-gray-600">Select a competitor to delete:</p>
            {evaluations.length === 0 ? (
              <p className="text-gray-500 mb-4">No competitors found.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation._id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-medium">
                      {evaluation.alternativeName}
                    </span>
                    <button
                      onClick={() => handleDeleteEvaluation(evaluation._id)}
                      disabled={deleteLoading}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Competitor Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Modify Competitor</h2>
            <p className="mb-4 text-gray-600">Select a competitor to modify:</p>
            {evaluations.length === 0 ? (
              <p className="text-gray-500 mb-4">No competitors found.</p>
            ) : (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {evaluations.map((evaluation) => (
                  <div
                    key={evaluation._id}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span className="font-medium">
                      {evaluation.alternativeName}
                    </span>
                    <button
                      onClick={() => handleModifyEvaluation(evaluation)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Modify
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DisplayEvaluations;
