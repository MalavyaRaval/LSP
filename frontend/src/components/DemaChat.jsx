import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";
import LeafProcessing from "./LeafProcessing.jsx";
import ParentProcessing from "./ParentProcessing.jsx";
import ProjectEvaluation from "./ProjectEvaluation.jsx";
import ProjectTree from "./ProjectTree.jsx";
import { buildPartialTree } from "./utils/partialTreeBuilder";

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
  const { projectname } = useParams();
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
  const [processedParentIds, setProcessedParentIds] = useState(() => {
    const storedProcessedIds = sessionStorage.getItem("processedParentIds");
    return storedProcessedIds
      ? new Set(JSON.parse(storedProcessedIds))
      : new Set();
  }); // This needs to be a useState
  // New state to track parents that have completed connection processing
  const [completedConnectionParents, setCompletedConnectionParents] = useState(
    () => {
      const storedCompletedConnections = sessionStorage.getItem(
        "completedConnectionParents"
      );
      return storedCompletedConnections
        ? new Set(JSON.parse(storedCompletedConnections))
        : new Set();
    }
  );
  const [evaluationStarted, setEvaluationStarted] = useState(false);
  const [history, setHistory] = useState([]); // Add history state to track previous states
  const [createdNodeIds, setCreatedNodeIds] = useState({}); // Track node IDs created at each parent
  const [originalChildren, setOriginalChildren] = useState([]); // New state to store original children for comparison
  const [showProjectTreeModal, setShowProjectTreeModal] = useState(false);
  const [partialTree, setPartialTree] = useState(null);

  // Computed value for processedParentIds (now combines with the state variable)
  const allVisibleProcessedIds = useMemo(() => {
    const ids = new Set(processedParentIds); // Start with the actual state
    // Add current parentId if it exists
    if (parentId) {
      ids.add(parentId);
    }
    // History is no longer directly iterated here, as processedParentIds state is maintained by explicit calls.
    return ids;
  }, [parentId, processedParentIds]);

  const getInitialChildren = () =>
    Array.from({ length: 5 }, (_, id) => ({
      id,
      name: "",
      decompose: null,
    }));

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
            // Populate childrenDetails with existing children, if any
            if (node && node.children && node.children.length > 0) {
              const existingChildren = node.children.map((child) => ({
                id: child.id,
                name: child.name,
                decompose: child.decompose,
              }));
              // Pad with empty rows if less than 5 children
              const paddedChildren = [...existingChildren];
              while (paddedChildren.length < 5) {
                paddedChildren.push({
                  id: Date.now() + paddedChildren.length, // Temporary ID for new empty rows
                  name: "",
                  decompose: null,
                });
              }
              setChildrenDetails(paddedChildren.slice(0, 5));
              setOriginalChildren(existingChildren); // Store original children for comparison
            } else {
              setChildrenDetails(getInitialChildren());
              setOriginalChildren([]); // No original children
            }
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

    // If the name is cleared, also reset the decompose field
    if (field === "name" && value.trim() === "") {
      newDetails[index]["decompose"] = null;
    }
    setChildrenDetails(newDetails);
  };

  // Update saveChildren to track created node IDs
  const saveChildren = async (childrenToSave) => {
    const effectiveParentId = parentId;
    if (!effectiveParentId) {
      alert("Parent node is not set. Please try again.");
      return [];
    }

    // Fetch the latest tree data to accurately determine the next node number
    let treeDataResponse;
    try {
      treeDataResponse = await axiosInstance.get(`/api/projects/${projectId}`);
    } catch (err) {
      console.error(
        "Error fetching tree data for node number generation:",
        err
      );
      throw err; // Re-throw to be caught by handleProcessChildren
    }
    const treeData = treeDataResponse.data;
    const currentParentInTree = findNodeById(treeData, effectiveParentId);

    // Determine the highest existing suffix for children of the current parent
    let maxSuffix = 0;
    if (currentParentInTree && currentParentInTree.children) {
      currentParentInTree.children.forEach((child) => {
        if (child.nodeNumber) {
          const parts = child.nodeNumber.split(parentNodeNumber);
          if (parts.length > 1) {
            const suffix = parseInt(parts[1], 10);
            if (!isNaN(suffix) && suffix > maxSuffix) {
              maxSuffix = suffix;
            }
          }
        }
      });
    }

    let treeDataToSend;

    // Separate children into those to add/update and those that are unchanged
    const childrenToAddOrUpdate = [];
    const unchangedChildren = [];

    childrenToSave.forEach((child) => {
      const originalChild = originalChildren.find((oc) => oc.id === child.id);

      // Check if the child is new or if its name or decompose status has changed
      if (
        !originalChild ||
        originalChild.name !== child.name ||
        originalChild.decompose !== child.decompose
      ) {
        childrenToAddOrUpdate.push(child);
      } else {
        unchangedChildren.push(child);
      }
    });

    // Create nodeNumbers for children based on parent's nodeNumber
    const nodesToSendToBackend = childrenToAddOrUpdate.map((child, index) => {
      // Generate a new node number if it's a new child, or keep existing for modified
      let nodeNumber = child.nodeNumber;
      const isNewChild = !originalChildren.some((oc) => oc.id === child.id);

      if (!nodeNumber || isNewChild) {
        maxSuffix += 1; // Increment for each new child
        nodeNumber = `${parentNodeNumber}${maxSuffix}`;
      }

      // Check if this child is a renamed version of an existing child
      const isRenamed = originalChildren.some(
        (originalChild) =>
          originalChild.id === child.id && originalChild.name !== child.name
      );

      // If it's a new child (no existing ID from originalChildren) or it's a renamed child, generate a new ID
      const childId =
        child.id &&
        typeof child.id === "string" &&
        child.id.startsWith(effectiveParentId) &&
        !isRenamed
          ? child.id // Keep existing temporary ID for modified rows that are not yet saved, if not renamed
          : `${effectiveParentId}-${Date.now()}-${index}`;

      return {
        id: childId,
        name: child.name.trim() || `Child ${index + 1}`,
        nodeNumber: nodeNumber,
        decompose: child.decompose,
        attributes: { created: Date.now() },
        children: [],
        parent: effectiveParentId,
        processed: false,
      };
    });

    let newChildrenInTree = [];

    if (nodesToSendToBackend.length > 0) {
      try {
        const res = await axiosInstance.post(
          `/api/projects/${projectId}/nodes`,
          {
            parentId: effectiveParentId,
            children: nodesToSendToBackend,
            metadata: {
              decisionProcess: "LSPrec",
              objectName: "My Object",
            },
          }
        );
        treeDataToSend = res.data;
        const parentNode = findNodeById(treeDataToSend, effectiveParentId);
        if (
          !parentNode ||
          !parentNode.children ||
          parentNode.children.length === 0
        ) {
          console.warn("No children were created for the current parent.");
          finalizeNode();
          return [];
        }

        const newChildrenIds = nodesToSendToBackend.map((node) => node.id);

        setCreatedNodeIds((prev) => ({
          ...prev,
          [effectiveParentId]: [
            ...(prev[effectiveParentId] || []),
            ...newChildrenIds,
          ],
        }));
        newChildrenInTree = parentNode.children;

        if (parentNode && parentNode.children) {
          const backendChildren = parentNode.children.map((child) => ({
            id: child.id,
            name: child.name,
            decompose: child.decompose,
          }));
          const paddedChildren = [...backendChildren];
          while (paddedChildren.length < 5) {
            paddedChildren.push({
              id: Date.now() + paddedChildren.length,
              name: "",
              decompose: null,
            });
          }
          setChildrenDetails(paddedChildren.slice(0, 5));
          setOriginalChildren(backendChildren);
        }
      } catch (error) {
        console.error("Error saving children:", error);
        throw error;
      }
    } else {
      treeDataToSend = treeData;
      const parentNode = findNodeById(treeData, effectiveParentId);
      if (parentNode && parentNode.children) {
        newChildrenInTree = parentNode.children;
      }
    }

    const currentQueue = JSON.parse(sessionStorage.getItem("bfsQueue") || "[]");
    const updatedCurrentQueue = currentQueue.map((node) =>
      node.id === effectiveParentId ? { ...node, processed: true } : node
    );

    const allChildrenForQueue = [...newChildrenInTree];

    const nodesToDecompose = allChildrenForQueue
      .filter(
        (child) =>
          child.decompose === true ||
          (child.attributes && child.attributes.decompose === true)
      )
      .map((node) => ({ ...node, processed: false }));

    const updatedQueue = [...updatedCurrentQueue, ...nodesToDecompose];
    sessionStorage.setItem("bfsQueue", JSON.stringify(updatedQueue));
    setBfsQueue(updatedQueue);

    const currentParentNode = findNodeById(treeDataToSend, parentId);
    if (currentParentNode && currentParentNode.children) {
      const updatedOriginalChildren = currentParentNode.children.map(
        (child) => ({
          id: child.id,
          name: child.name,
          decompose: child.decompose,
        })
      );
      setOriginalChildren(updatedOriginalChildren);
    } else {
      setOriginalChildren([]);
    }

    setProcessing(false);
    setProcessedParentIds((prev) => {
      const newState = new Set(prev).add(parentId);
      sessionStorage.setItem(
        "processedParentIds",
        JSON.stringify(Array.from(newState))
      );
      return newState;
    }); // Add current parent to processed list

    setShowProjectTreeModal(true);
    window.dispatchEvent(new Event("refreshProjectTree"));

    return updatedQueue;
  };

  const deleteChildren = async (nodeIdsToDelete) => {
    if (nodeIdsToDelete.length === 0) return;
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/nodes`, {
        data: { nodeIds: nodeIdsToDelete },
      });
      console.log("Deleted nodes:", nodeIdsToDelete);
    } catch (error) {
      console.error("Error deleting children:", error);
    }
  };

  const handleProcessChildren = async (nonEmptyChildren) => {
    try {
      setProcessing(true);

      const nodeIdsToDelete = originalChildren
        .filter((originalChild) => {
          const currentVersion = nonEmptyChildren.find(
            (child) => child.id === originalChild.id
          );
          return !currentVersion || currentVersion.name !== originalChild.name;
        })
        .map((child) => child.id);

      if (nodeIdsToDelete.length > 0) {
        await deleteChildren(nodeIdsToDelete);
      }

      await saveChildren(nonEmptyChildren);

      setShowProjectTreeModal(true);
      window.dispatchEvent(new Event("refreshProjectTree"));
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
      const previousState = history[history.length - 1];

      setHistory((prev) => prev.slice(0, -1));

      // Revert processedParentIds to the state *before* this parent was processed
      const updatedProcessedParentIds = new Set(
        previousState.bfsQueue
          .filter((node) => node.processed)
          .map((node) => node.id)
      );
      setProcessedParentIds(updatedProcessedParentIds);

      try {
        const nodesToDelete = createdNodeIds[previousState.parentId] || [];

        if (nodesToDelete.length > 0) {
          await axiosInstance.delete(`/api/projects/${projectId}/nodes`, {
            data: { nodeIds: nodesToDelete },
          });

          setCreatedNodeIds((prev) => {
            const newState = { ...prev };
            delete newState[previousState.parentId];
            return newState;
          });
        }

        setParentId(previousState.parentId);
        setParentName(previousState.parentName);
        setParentNodeNumber(previousState.parentNodeNumber);

        const res = await axiosInstance.get(`/api/projects/${projectId}`);
        const treeData = res.data;
        const node = findNodeById(treeData, previousState.parentId);

        if (node && node.children && node.children.length > 0) {
          const existingChildren = node.children.map((child) => ({
            id: child.id,
            name: child.name,
            decompose: child.decompose,
          }));
          const paddedChildren = [...existingChildren];
          while (paddedChildren.length < 5) {
            paddedChildren.push({
              id: Date.now() + paddedChildren.length,
              name: "",
              decompose: null,
            });
          }
          setChildrenDetails(paddedChildren.slice(0, 5));
          setOriginalChildren(existingChildren);
        } else {
          setChildrenDetails(getInitialChildren());
          setOriginalChildren([]);
        }

        if (previousState.bfsQueue) {
          sessionStorage.setItem(
            "bfsQueue",
            JSON.stringify(previousState.bfsQueue)
          );
          setBfsQueue(previousState.bfsQueue);
        }

        setProcessingLeaves(false);
        setProcessingParents(false);
        setEvaluationStarted(false);

        window.dispatchEvent(new Event("refreshProjectTree"));
      } catch (err) {
        console.error("Error during back operation:", err);
        setParentId(previousState.parentId);
        setParentName(previousState.parentName);
        setParentNodeNumber(previousState.parentNodeNumber);
        setChildrenDetails(getInitialChildren());

        if (previousState.bfsQueue) {
          sessionStorage.setItem(
            "bfsQueue",
            JSON.stringify(previousState.bfsQueue)
          );
          setBfsQueue(previousState.bfsQueue);
        }
      }
    } else {
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}`);
        if (res.data && res.data.id) {
          const rootId = res.data.id.toString();

          if (parentId === rootId || parentId === "1") {
            navigate("/home");
            return;
          }

          let existingTree = res.data;

          setParentId(rootId);
          setParentNodeNumber(res.data.nodeNumber || "1");
          setParentName(res.data.name || "Root");
          setChildrenDetails(getInitialChildren());

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

          sessionStorage.setItem("bfsQueue", JSON.stringify(bfsQueue));
          setBfsQueue(bfsQueue);

          setProcessingLeaves(false);
          setProcessingParents(false);
          setEvaluationStarted(false);
          setCreatedNodeIds({});

          window.dispatchEvent(new Event("refreshProjectTree"));
        }
      } catch (err) {
        console.error("Failed to fetch project root:", err);
      }
    }
  };

  const finalizeNode = async () => {
    alert("All decompositions complete.");
    window.dispatchEvent(new Event("refreshProjectTree"));
    setParentId(null); // Reset parentId to indicate no active decomposition
    setChildrenDetails(getInitialChildren());

    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = res.data;

      const leaves = getLeafNodes(treeData);
      if (leaves.length > 0) {
        setLeafNodes(leaves);
        setProcessingLeaves(true);
        setCurrentLeafIndex(0);
      } else {
        // If no leaves, immediately check for parents needing connection
        const parentsToProcessForConnection = Array.from(processedParentIds)
          .filter((pid) => !completedConnectionParents.has(pid))
          .map((pid) => findNodeById(treeData, pid))
          .filter(Boolean);

        if (parentsToProcessForConnection.length > 0) {
          setParentNodes(parentsToProcessForConnection);
          setCurrentParentIndex(0);
          setProcessingParents(true);
        } else {
          alert(
            "All parent nodes and leaves completed process. Tree finalization complete."
          );
          setEvaluationStarted(true);
        }
      }
    } catch (error) {
      console.error("Error during finalization process:", error);
      setEvaluationStarted(true);
    }
    sessionStorage.removeItem("bfsQueue");
    window.dispatchEvent(new Event("refreshProjectTree"));
  };

  const startParentProcessing = async () => {
    try {
      const res = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = res.data;

      // Get all nodes that have been processed for decomposition (their children defined)
      let parentsToProcess = Array.from(processedParentIds)
        .map((pid) => findNodeById(treeData, pid))
        .filter(Boolean); // Filter out any nulls if node not found

      // If the root node has been processed for decomposition, ensure it's included
      // and placed at the beginning of the list if it's not already there.
      if (
        treeData &&
        treeData.id &&
        processedParentIds.has(treeData.id.toString()) &&
        !parentsToProcess.some(
          (node) => node.id?.toString() === treeData.id.toString()
        )
      ) {
        const rootNode = findNodeById(treeData, treeData.id);
        if (rootNode) {
          parentsToProcess.unshift(rootNode); // Add root to the beginning
        }
      }

      if (parentsToProcess.length > 0) {
        setParentNodes(parentsToProcess);
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

  useEffect(() => {
    setParentId(null);
    setParentName("");
    setParentNodeNumber("1");
    setChildrenDetails(getInitialChildren());
    setProcessing(false);
    setBfsQueue([]);
    setProcessingLeaves(false);
    setLeafNodes([]);
    setCurrentLeafIndex(0);
    setLeafValues({});
    setError("");
    setProcessingParents(false);
    setParentNodes([]);
    setCurrentParentIndex(0);
    setProcessedParentIds(new Set()); // Explicitly reset on project change
    setCompletedConnectionParents(new Set()); // New reset
    sessionStorage.removeItem("processedParentIds");
    sessionStorage.removeItem("completedConnectionParents"); // New removal
    setEvaluationStarted(false);
    setHistory([]);
    setCreatedNodeIds({});
    sessionStorage.removeItem("bfsQueue");
    window.dispatchEvent(new Event("refreshProjectTree"));
  }, [projectId]);

  useEffect(() => {
    const fetchPartialTree = async () => {
      if (!showProjectTreeModal) return;
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}`);
        const treeData = res.data;
        // Combine processedParentIds and current parentId for the partial tree builder
        const idsToShow = new Set(allVisibleProcessedIds);
        const partial = buildPartialTree(treeData, idsToShow);
        setPartialTree(partial);
      } catch (err) {
        setPartialTree(null);
      }
    };
    fetchPartialTree();
  }, [showProjectTreeModal, processedParentIds, parentId, projectId]);

  const renderStep = () => {
    if (evaluationStarted) {
      return <ProjectEvaluation />;
    }
    if (processingLeaves) {
      return (
        <div className="flex flex-row gap-4 w-full">
          <div className="w-2/3">
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
                  // After all leaves are processed, move to parent connection processing
                  (async () => {
                    try {
                      const res = await axiosInstance.get(
                        `/api/projects/${projectId}`
                      );
                      const treeData = res.data;
                      const parentsToProcessForConnection = Array.from(
                        processedParentIds
                      )
                        .filter((pid) => !completedConnectionParents.has(pid))
                        .map((pid) => findNodeById(treeData, pid))
                        .filter(Boolean);

                      // Failsafe for root node (similar to finalizeNode)
                      if (
                        treeData &&
                        treeData.id &&
                        processedParentIds.has(treeData.id.toString()) &&
                        !completedConnectionParents.has(
                          treeData.id.toString()
                        ) &&
                        !parentsToProcessForConnection.some(
                          (node) => node.id === treeData.id
                        )
                      ) {
                        const rootNode = findNodeById(treeData, treeData.id);
                        if (rootNode) {
                          parentsToProcessForConnection.unshift(rootNode); // Add root to the beginning
                        }
                      }

                      console.log(
                        "onNextLeaf: parentsToProcessForConnection after leaves",
                        parentsToProcessForConnection.map((p) => p.id)
                      );

                      if (parentsToProcessForConnection.length > 0) {
                        setParentNodes(parentsToProcessForConnection);
                        setCurrentParentIndex(0);
                        setProcessingParents(true);
                      } else {
                        // No parents need connection processing, proceed to final evaluation
                        alert(
                          "All parent nodes and leaves completed process. Tree finalization complete."
                        );
                        setEvaluationStarted(true);
                      }
                    } catch (error) {
                      console.error(
                        "Error fetching tree after leaf processing:",
                        error
                      );
                      setEvaluationStarted(true);
                    }
                  })();
                }
              }}
              onPrevLeaf={() => {
                if (currentLeafIndex > 0) {
                  setCurrentLeafIndex(currentLeafIndex - 1);
                }
              }}
              onBackToParentProcess={handleBack}
            />
          </div>
          <div className="w-1/3 p-2 bg-white rounded-lg shadow-md mx-0">
            <h2 className="text-xl font-semibold mb-2">Project Tree</h2>
            <ProjectTree
              projectId={projectId}
              processedNodes={allVisibleProcessedIds}
              highlightedNodeId={leafNodes[currentLeafIndex]?.id}
            />
          </div>
        </div>
      );
    }
    if (processingParents) {
      return (
        <ParentProcessing
          parentNodes={parentNodes}
          currentParentIndex={currentParentIndex}
          onNextParent={() => {
            // Mark the current parent as having completed its connection processing
            const completedParentId = parentNodes[currentParentIndex].id;
            setCompletedConnectionParents((prev) => {
              const newState = new Set(prev).add(completedParentId);
              sessionStorage.setItem(
                "completedConnectionParents",
                JSON.stringify(Array.from(newState))
              );
              console.log(
                "onNextParent: Added to completedConnectionParents",
                completedParentId,
                ", New state:",
                Array.from(newState)
              );
              return newState;
            });

            if (currentParentIndex < parentNodes.length - 1) {
              setCurrentParentIndex(currentParentIndex + 1);
            } else {
              // All parents in the current batch have had connections processed.
              setProcessingParents(false); // Stop parent processing (for connections)
              // Now move to final project evaluation
              alert(
                "All parent nodes and leaves completed process. Tree finalization complete."
              );
              setEvaluationStarted(true);
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
    return (
      <div className="p-0 bg-white rounded-lg mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-0">
          Analyzed item:
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
                  Do you intend to further decompose this component?
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
        </div>
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
        {showProjectTreeModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl m-4 max-w-6xl w-full h-[90vh] flex flex-col">
              <h3 className="text-xl font-bold mb-4">Project Tree</h3>
              <div
                className="flex-grow overflow-y-auto mb-4"
                style={{ scrollBehavior: "smooth" }}
              >
                <ProjectTree
                  projectId={projectId}
                  processedNodes={allVisibleProcessedIds}
                  bfsQueue={bfsQueue}
                  currentParentId={parentId}
                  treeData={partialTree}
                />
              </div>
              <div className="flex justify-end space-x-4 mt-auto">
                <button
                  onClick={() => {
                    setShowProjectTreeModal(false);
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setShowProjectTreeModal(false);
                    const updatedQueue = JSON.parse(
                      sessionStorage.getItem("bfsQueue") || "[]"
                    );
                    const nextNode = updatedQueue.find(
                      (node) => !node.processed
                    );
                    if (nextNode) {
                      const newQueue = updatedQueue.map((node) =>
                        node.id === nextNode.id
                          ? { ...node, currentlyProcessing: true }
                          : node
                      );
                      sessionStorage.setItem(
                        "bfsQueue",
                        JSON.stringify(newQueue)
                      );
                      setBfsQueue(newQueue);
                      setParentId(nextNode.id);
                      setParentNodeNumber(nextNode.nodeNumber || "1");
                      setChildrenDetails(getInitialChildren());
                    } else {
                      finalizeNode();
                    }
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  return <div className="w-full h-full bg-gray-50">{renderStep()}</div>;
};

export default DemaChat;
