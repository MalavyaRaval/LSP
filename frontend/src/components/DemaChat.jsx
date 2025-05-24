import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";
import LeafProcessing from "./LeafProcessing.jsx";
import ParentProcessing from "./ParentProcessing.jsx";
import ProjectEvaluation from "./ProjectEvaluation.jsx";

// Helper: recursively extract leaf nodes (nodes with no children)
const getLeafNodes = (node) => {
  if (!node.children || node.children.length === 0) return [node];
  let leaves = [];
  node.children.forEach((child) => {
    leaves = leaves.concat(getLeafNodes(child));
  });
  return leaves;
};

// Set INITIAL_CHILDREN to 5 rows by default.
const INITIAL_CHILDREN = Array.from({ length: 5 }, (_, id) => ({
  id,
  name: "",
  decompose: null,
}));

const DemaChat = () => {
  const { username, projectname } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const parentIdQuery = query.get("parentId");

  const projectId = projectname;
  const [parentId, setParentId] = useState(parentIdQuery || null);
  const [parentName, setParentName] = useState("");
  const [parentNodeNumber, setParentNodeNumber] = useState("1"); // Store parent's node number
  // Use five preset rows.
  const [childrenDetails, setChildrenDetails] = useState(INITIAL_CHILDREN);
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [bfsQueue, setBfsQueue] = useState([]);
  // States for leaf processing.
  const [processingLeaves, setProcessingLeaves] = useState(false);
  const [leafNodes, setLeafNodes] = useState([]);
  const [currentLeafIndex, setCurrentLeafIndex] = useState(0);
  const [leafValues, setLeafValues] = useState({});
  const [error, setError] = useState("");
  // States for parent processing.
  const [processingParents, setProcessingParents] = useState(false);
  const [parentNodes, setParentNodes] = useState([]);
  const [currentParentIndex, setCurrentParentIndex] = useState(0);
  // New state to track processed parent IDs.
  const [processedParentIds, setProcessedParentIds] = useState(new Set());
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [history, setHistory] = useState([]); // Add history state to track previous states
  const [createdNodeIds, setCreatedNodeIds] = useState({}); // Track node IDs created at each parent
  const [nodeCreationTimestamps, setNodeCreationTimestamps] = useState({}); // Track when nodes were created
  const [lastNavigationTimestamp, setLastNavigationTimestamp] = useState(0); // Track when we last visited a node

  const messagesEndRef = useRef(null);

  const getInitialChildren = () =>
    Array.from({ length: 5 }, (_, id) => ({
      id,
      name: "",
      decompose: null,
    }));

  // Single step: Enter details for each Component.
  const steps = [
    {
      id: "childrenDetails",
      question: "Analyzed item:",
    },
  ];

  // Helper: Recursively find a node by id.
  const findNodeById = (node, id) => {
    if (node.id?.toString() === id.toString()) return node;
    if (!node.children || node.children.length === 0) return null;
    for (let child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  };

  useEffect(() => {
    const storedQueue = JSON.parse(sessionStorage.getItem("bfsQueue") || "[]");
    setBfsQueue(storedQueue);
  }, []);

  useEffect(() => {
    const fetchRoot = async () => {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}`);
        if (res.data && res.data.id) {
          setParentId(res.data.id.toString());
          setParentNodeNumber(res.data.nodeNumber || "1"); // Get root node number
        } else {
          console.warn("No root node found; check backend logic.");
        }
      } catch (err) {
        console.error("Failed to fetch project root:", err);
      }
    };
    if (projectId && !parentId) {
      fetchRoot();
    }
  }, [projectId, parentId]);

  useEffect(() => {
    const fetchParentName = async () => {
      if (parentId) {
        try {
          const res = await axiosInstance.get(`/api/projects/${projectId}`);
          if (res.data) {
            const treeData = res.data;
            const node = findNodeById(treeData, parentId);
            setParentName((node && node.name) || "Unknown");
            setParentNodeNumber(
              node && node.nodeNumber ? node.nodeNumber : "1"
            );
          }
        } catch (err) {
          console.error("Error fetching parent details:", err);
          setParentName("Unknown");
        }
      }
    };
    fetchParentName();
  }, [parentId, projectId]);

  useEffect(() => {
    const pid = new URLSearchParams(location.search).get("parentId");
    if (pid) setParentId(pid);
  }, [location.search]);

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...childrenDetails];
    newDetails[index][field] = field === "decompose" ? value === "true" : value;
    setChildrenDetails(newDetails);
  };

  // Update saveChildren to track created node IDs
  const saveChildren = async (childrenToSave) => {
    const effectiveParentId = parentId;
    if (!effectiveParentId) {
      alert("Parent node is not set. Please try again.");
      return [];
    }

    // Create nodeNumbers for children based on parent's nodeNumber
    const childrenNodes = childrenToSave.map((child, index) => {
      // Create a new node number based on parent's node number and child index (1-based)
      const nodeNumber = `${parentNodeNumber}${index + 1}`;

      // Generate a unique ID for this child
      const childId = `${effectiveParentId}-${Date.now()}-${index}`;

      return {
        id: childId,
        name: child.name.trim() || `Child ${index + 1}`,
        nodeNumber: nodeNumber, // Add the nodeNumber to the node
        decompose: child.decompose,
        attributes: { created: Date.now() },
        children: [],
        parent: effectiveParentId,
        processed: false, // Add a flag to track processed state
      };
    });

    try {
      const res = await axiosInstance.post(`/api/projects/${projectId}/nodes`, {
        parentId: effectiveParentId,
        children: childrenNodes,
        metadata: {
          decisionProcess: "LSPrec",
          objectName: "My Object",
        },
      });
      const treeData = res.data;
      const parentNode = findNodeById(treeData, effectiveParentId);
      if (
        !parentNode ||
        !parentNode.children ||
        parentNode.children.length === 0
      ) {
        console.warn("No children were created for the current parent.");
        finalizeNode();
        return [];
      }

      // Extract the IDs of the newly created children
      const newChildrenIds = childrenNodes.map((node) => node.id);

      // Save these IDs for this parent
      setCreatedNodeIds((prev) => ({
        ...prev,
        [effectiveParentId]: [
          ...(prev[effectiveParentId] || []),
          ...newChildrenIds,
        ],
      }));

      // Mark the current parent as processed
      const currentQueue = JSON.parse(
        sessionStorage.getItem("bfsQueue") || "[]"
      );
      const updatedCurrentQueue = currentQueue.map((node) =>
        node.id === effectiveParentId ? { ...node, processed: true } : node
      );

      const createdChildren = parentNode.children;
      const nodesToDecompose = createdChildren
        .filter(
          (child) =>
            child.decompose === true ||
            (child.attributes && child.attributes.decompose === true)
        )
        .map((node) => ({
          ...node,
          processed: false,
        }));

      // Combine current queue with new nodes
      const updatedQueue = [...updatedCurrentQueue, ...nodesToDecompose];
      sessionStorage.setItem("bfsQueue", JSON.stringify(updatedQueue));
      setBfsQueue(updatedQueue);
      return updatedQueue;
    } catch (error) {
      console.error("Error saving children:", error);
      throw error;
    }
  };

  // Update handleProcessChildren to work with the filtered non-empty rows.
  const handleProcessChildren = async (nonEmptyChildren) => {
    try {
      setProcessing(true);
      const updatedQueue = await saveChildren(nonEmptyChildren);
      if (updatedQueue && updatedQueue.length > 0) {
        // Find the FIRST unprocessed node to maintain BFS order
        const nextNode = updatedQueue.find((node) => !node.processed);
        if (nextNode) {
          // Mark this node as currently being processed
          const newQueue = updatedQueue.map((node) =>
            node.id === nextNode.id
              ? { ...node, currentlyProcessing: true }
              : node
          );

          // Update the queue but don't remove the node - it stays in the queue until its children are added
          sessionStorage.setItem("bfsQueue", JSON.stringify(newQueue));
          setBfsQueue(newQueue);

          // Navigate to this node
          setParentId(nextNode.id);
          setParentNodeNumber(nextNode.nodeNumber || "1");
          setChildrenDetails(getInitialChildren());
        } else {
          finalizeNode();
        }
      } else {
        finalizeNode();
      }
    } catch (error) {
      console.error("Error processing Components:", error);
      alert("Failed to process Components nodes.");
    } finally {
      setProcessing(false);
    }
  };

  const handleNextStep = () => {
    const nonEmpty = childrenDetails.filter((child) => child.name.trim());
    if (nonEmpty.length < 2) {
      alert("Please fill in at least 2 component names.");
      return;
    }
    if (nonEmpty.some((child) => child.decompose === null)) {
      alert("Please select Yes or No for all filled rows.");
      return;
    }

    // Save current state to history before proceeding
    const currentBfsQueue = JSON.parse(
      sessionStorage.getItem("bfsQueue") || "[]"
    );

    setHistory((prev) => [
      ...prev,
      {
        parentId,
        parentName,
        parentNodeNumber,
        bfsQueue: currentBfsQueue,
      },
    ]);

    handleProcessChildren(nonEmpty);
  };

  const handleBack = async () => {
    if (history.length > 0) {
      // Get the last history entry - this is where we're going back to
      const previousState = history[history.length - 1];

      // Remove the entry from history
      setHistory((prev) => prev.slice(0, -1));

      try {
        // Get the IDs of nodes created under this parent - these are the ones we'll delete
        const nodesToDelete = createdNodeIds[previousState.parentId] || [];

        if (nodesToDelete.length > 0) {
          // Delete specifically these nodes
          await axiosInstance.delete(`/api/projects/${projectId}/nodes`, {
            data: { nodeIds: nodesToDelete },
          });
          console.log(
            `Successfully removed ${nodesToDelete.length} nodes created under ${previousState.parentId}`
          );

          // Remove these IDs from our tracking state
          setCreatedNodeIds((prev) => {
            const newState = { ...prev };
            delete newState[previousState.parentId];
            return newState;
          });
        }

        // Restore the parent state
        setParentId(previousState.parentId);
        setParentName(previousState.parentName);
        setParentNodeNumber(previousState.parentNodeNumber);

        // Reset the children details
        setChildrenDetails(getInitialChildren());

        // CRITICAL CHANGE: Restore the BFS queue from the history instead of clearing it
        // This ensures we preserve the siblings that need processing
        if (previousState.bfsQueue) {
          sessionStorage.setItem(
            "bfsQueue",
            JSON.stringify(previousState.bfsQueue)
          );
          setBfsQueue(previousState.bfsQueue);
        }

        // Reset processing states
        setProcessingLeaves(false);
        setProcessingParents(false);
        setEvaluationStarted(false);

        // Refresh the project tree to reflect changes
        window.dispatchEvent(new Event("refreshProjectTree"));
      } catch (err) {
        console.error("Error during back operation:", err);
        // Fallback - at minimum restore the parent state
        setParentId(previousState.parentId);
        setParentName(previousState.parentName);
        setParentNodeNumber(previousState.parentNodeNumber);
        setChildrenDetails(getInitialChildren());

        // Even in error case, try to restore queue
        if (previousState.bfsQueue) {
          sessionStorage.setItem(
            "bfsQueue",
            JSON.stringify(previousState.bfsQueue)
          );
          setBfsQueue(previousState.bfsQueue);
        }
      }
    } else {
      // If no history, go back to the root
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}`);
        if (res.data && res.data.id) {
          const rootId = res.data.id.toString();

          // Keep track of existing nodes to scan for proper BFS ordering
          let existingTree = res.data;

          // Set to root node
          setParentId(rootId);
          setParentNodeNumber(res.data.nodeNumber || "1");
          setParentName(res.data.name || "Root");
          setChildrenDetails(getInitialChildren());

          // Get all direct children of the root that should be processed
          let bfsQueue = [];
          if (existingTree.children && existingTree.children.length > 0) {
            bfsQueue = existingTree.children
              .filter(
                (child) =>
                  child.decompose === true ||
                  (child.attributes && child.attributes.decompose === true)
              )
              .map((node) => ({
                ...node,
                processed: false,
              }));
          }

          // Update the queue with these nodes
          sessionStorage.setItem("bfsQueue", JSON.stringify(bfsQueue));
          setBfsQueue(bfsQueue);

          // Reset all states
          setProcessingLeaves(false);
          setProcessingParents(false);
          setEvaluationStarted(false);
          setCreatedNodeIds({});

          // Refresh the project tree to reflect changes
          window.dispatchEvent(new Event("refreshProjectTree"));
        }
      } catch (err) {
        console.error("Failed to fetch project root:", err);
      }
    }
  };

  // Helper function to get all descendant IDs of a node (for removing from queue)
  const getAllDescendantIds = (node) => {
    if (!node) return [];
    if (!node.children || node.children.length === 0) return [];

    let descendants = [];

    const collectDescendants = (currentNode) => {
      if (!currentNode) return;
      if (currentNode.id) descendants.push(currentNode.id.toString());

      if (currentNode.children && currentNode.children.length > 0) {
        currentNode.children.forEach((child) => {
          if (child.id) descendants.push(child.id.toString());
          collectDescendants(child);
        });
      }
    };

    node.children.forEach((child) => {
      if (child.id) descendants.push(child.id.toString());
      collectDescendants(child);
    });

    return descendants;
  };

  const finalizeNode = async () => {
    alert("All decompositions complete.");
    window.dispatchEvent(new Event("refreshProjectTree"));
    setParentId(null);
    // Reset children details to five preset rows.
    setChildrenDetails(getInitialChildren());
    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = res.data;
      const leaves = getLeafNodes(treeData);
      console.log("Leaf nodes found:", leaves);
      setLeafNodes(leaves);
      setProcessingLeaves(true);
      setCurrentLeafIndex(0);
      setProcessedParentIds(new Set());
      const hasParentNodes = treeData.children && treeData.children.length > 0;
      if (!hasParentNodes) {
        alert(
          "All parent nodes completed process. Tree finalization complete."
        );
        setEvaluationStarted(true);
      }
    } catch (error) {
      console.error("Error fetching tree after finalizing:", error);
    }
  };

  // Parent processing functions remain unchanged...
  const startParentProcessing = async () => {
    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = res.data;
      let initialParentIds = new Set();
      leafNodes.forEach((leaf) => {
        if (leaf.parent && leaf.parent.toString() !== treeData.id.toString()) {
          initialParentIds.add(leaf.parent.toString());
        }
      });
      const filteredParentIds = Array.from(initialParentIds).filter(
        (pid) => !processedParentIds.has(pid)
      );
      const newProcessed = new Set(processedParentIds);
      filteredParentIds.forEach((pid) => newProcessed.add(pid));
      setProcessedParentIds(newProcessed);
      const parentNodesArr = filteredParentIds
        .map((pid) => findNodeById(treeData, pid))
        .filter(Boolean);
      if (parentNodesArr.length > 0) {
        setParentNodes(parentNodesArr);
        setCurrentParentIndex(0);
        setProcessingParents(true);
      } else {
        alert(
          "All parent nodes completed process. Tree finalization complete."
        );
        setEvaluationStarted(true);
      }
    } catch (err) {
      console.error("Error starting parent processing:", err);
    }
  };

  const processNextParentLevel = async () => {
    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = res.data;
      let nextLevelParentIds = new Set();
      parentNodes.forEach((node) => {
        if (node.parent && node.parent.toString() !== treeData.id.toString()) {
          nextLevelParentIds.add(node.parent.toString());
        }
      });
      const filteredNextIds = Array.from(nextLevelParentIds).filter(
        (pid) => !processedParentIds.has(pid)
      );
      const newProcessed = new Set(processedParentIds);
      filteredNextIds.forEach((pid) => newProcessed.add(pid));
      setProcessedParentIds(newProcessed);
      const nextParentsArr = filteredNextIds
        .map((pid) => findNodeById(treeData, pid))
        .filter(Boolean);
      if (nextParentsArr.length > 0) {
        setParentNodes(nextParentsArr);
        setCurrentParentIndex(0);
      } else {
        setProcessingParents(false);
        setEvaluationStarted(true);
      }
    } catch (err) {
      console.error("Error processing next parent level:", err);
    }
  };

  const renderStep = () => {
    if (evaluationStarted) {
      return <ProjectEvaluation />;
    }
    if (processingLeaves) {
      return (
        <LeafProcessing
          leafNodes={leafNodes}
          currentLeafIndex={currentLeafIndex}
          leafValues={leafValues}
          setLeafValues={setLeafValues}
          error={error}
          setError={setError}
          onNextLeaf={() => {
            if (currentLeafIndex < leafNodes.length - 1) {
              setCurrentLeafIndex(currentLeafIndex + 1);
            } else {
              setProcessingLeaves(false);
              startParentProcessing();
            }
          }}
          onPrevLeaf={() => {
            if (currentLeafIndex > 0) {
              setCurrentLeafIndex(currentLeafIndex - 1);
            }
          }}
        />
      );
    }
    if (processingParents) {
      return (
        <ParentProcessing
          parentNodes={parentNodes}
          currentParentIndex={currentParentIndex}
          onNextParent={() => {
            if (currentParentIndex < parentNodes.length - 1) {
              setCurrentParentIndex(currentParentIndex + 1);
            } else {
              processNextParentLevel();
            }
          }}
          onPrevParent={() => {
            if (currentParentIndex > 0) {
              setCurrentParentIndex(currentParentIndex - 1);
            }
          }}
          projectId={projectId}
        />
      );
    }
    // Render fixed five rows without an Add Row button.
    return (
      <div className="p-0 bg-white rounded-lg mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-0">
          {steps[0].question}{" "}
          <span className="text-indigo-600">
            [{parentNodeNumber}] {parentName}
          </span>
        </h2>
        <p className="text-2xl text-red-700 mt-0 mb-3">
          Please enter up to 5 components of this item
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-1 py-0 text-left text-2xl font-bold text-gray-700 uppercase">
                  Component Name
                </th>
                <th className="px-1 py-0 text-center text-2xl font-bold text-gray-700 uppercase">
                  Further decompose?
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {childrenDetails.map((child, index) => (
                <tr key={index}>
                  <td className="px-2 py-0">
                    <input
                      type="text"
                      placeholder={`Please enter Component ${index + 1} name`}
                      value={child.name}
                      onChange={(e) =>
                        handleDetailChange(index, "name", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg py-2 px-3 w-full text-xl font-semibold"
                      style={{ fontSize: "1.5rem", width: "100%" }}
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <select
                      value={
                        child.decompose === null
                          ? ""
                          : child.decompose
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        handleDetailChange(index, "decompose", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg py-2 px-3 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ fontSize: "1.5rem" }}
                    >
                      <option value="" style={{ fontSize: "1.5rem" }}>
                        Select
                      </option>
                      <option value="true" style={{ fontSize: "1.5rem" }}>
                        Yes
                      </option>
                      <option value="false" style={{ fontSize: "1.5rem" }}>
                        No
                      </option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>{" "}
        <div className="flex items-center mt-4 space-x-4">
          <button
            onClick={handleBack}
            className="text-lg font-extrabold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center"
          >
            <span style={{ fontSize: "2rem" }}>Back</span>
          </button>
          <div className="flex-grow"></div>
          <button
            onClick={handleNextStep}
            className="text-lg font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px] flex items-center justify-center"
            disabled={processing}
            style={{ marginRight: "130px" }}
          >
            {processing ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span style={{ fontSize: "1.5rem" }}>Processing...</span>
              </span>
            ) : (
              <span style={{ fontSize: "2rem" }}>Continue</span>
            )}
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="w-full h-full bg-gray-50">
      {renderStep()}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default DemaChat;
