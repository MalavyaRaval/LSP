import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
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
      question: "Defining components of the following compound item ",
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
        if (!parentId) {
          const res = await axios.get(
            `http://localhost:8000/api/projects/${projectId}`
          );
          if (res.data && res.data.id) {
            setParentId(res.data.id.toString());
          } else {
            console.warn("No root node found; check backend logic.");
          }
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
          const res = await axios.get(
            `http://localhost:8000/api/projects/${projectId}`
          );
          if (res.data) {
            const treeData = res.data;
            const node = findNodeById(treeData, parentId);
            setParentName((node && node.name) || "Unknown");
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

  // Update saveChildren to accept only the non-empty rows.
  const saveChildren = async (childrenToSave) => {
    const effectiveParentId = parentId;
    if (!effectiveParentId) {
      alert("Parent node is not set. Please try again.");
      return [];
    }

    const childrenNodes = childrenToSave.map((child, index) => ({
      id: `${effectiveParentId}-${Date.now()}-${index}`,
      name: child.name.trim() || `Child ${index + 1}`,
      decompose: child.decompose,
      attributes: { created: Date.now() },
      children: [],
      parent: effectiveParentId,
    }));

    try {
      const res = await axios.post(
        `http://localhost:8000/api/projects/${projectId}/nodes`,
        {
          parentId: effectiveParentId,
          children: childrenNodes,
          metadata: {
            decisionProcess: "LSP Rec",
            objectName: "My Object",
          },
        }
      );
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
      const createdChildren = parentNode.children;
      const nodesToDecompose = createdChildren.filter(
        (child) =>
          child.decompose === true ||
          (child.attributes && child.attributes.decompose === true)
      );

      const storedQueue = JSON.parse(
        sessionStorage.getItem("bfsQueue") || "[]"
      );
      const updatedQueue = [...storedQueue, ...nodesToDecompose];
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
        const [nextNode, ...remaining] = updatedQueue;
        sessionStorage.setItem("bfsQueue", JSON.stringify(remaining));
        setBfsQueue(remaining);
        setParentId(nextNode.id);
        // Reset children details to five preset rows after processing.
        setChildrenDetails(getInitialChildren());
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
    handleProcessChildren(nonEmpty);
  };

  const finalizeNode = async () => {
    alert("All decompositions complete.");
    window.dispatchEvent(new Event("refreshProjectTree"));
    setParentId(null);
    // Reset children details to five preset rows.
    setChildrenDetails(getInitialChildren());
    try {
      const res = await axios.get(
        `http://localhost:8000/api/projects/${projectId}`
      );
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
      const res = await axios.get(
        `http://localhost:8000/api/projects/${projectId}`
      );
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
      const res = await axios.get(
        `http://localhost:8000/api/projects/${projectId}`
      );
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
      <div className="p-6 bg-white rounded-lg shadow-md mx-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {steps[0].question}{" "}
          <span className="text-indigo-600">{parentName}</span>
        </h2>
        <p className="text-red-500 text-ml mb-4">
          Enter up to 5 components of the analyzed item
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Component Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Do you want to further decompose this component?
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {childrenDetails.map((child, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder={`Component ${index + 1} name`}
                      value={child.name}
                      onChange={(e) =>
                        handleDetailChange(index, "name", e.target.value)
                      }
                      className="border border-gray-300 rounded-lg p-2 w-full"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
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
                      className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Please select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end items-center mt-6">
          <button
            onClick={handleNextStep}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-xl"
            disabled={processing}
          >
            {processing ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-gray-200 rounded-t-lg">
        <h1 className="text-xl font-bold text-gray-800">LSP Rec</h1>
      </header>
      <main className="flex-1 p-4 overflow-y-auto">{renderStep()}</main>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default DemaChat;
