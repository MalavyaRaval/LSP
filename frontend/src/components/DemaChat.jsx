import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import LeafProcessing from "./LeafProcessing.jsx"; // New import

// Helper: recursively extract leaf nodes (nodes with no children)
const getLeafNodes = (node) => {
  if (!node.children || node.children.length === 0) return [node];
  let leaves = [];
  node.children.forEach((child) => {
    leaves = leaves.concat(getLeafNodes(child));
  });
  return leaves;
};

const DemaChat = () => {
  const { username, projectname } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const parentIdQuery = query.get("parentId");

  // Use projectname as the projectId.
  const projectId = projectname;
  const [parentId, setParentId] = useState(parentIdQuery || null);
  const [parentName, setParentName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [childrenCount, setChildrenCount] = useState("");
  const [childrenDetails, setChildrenDetails] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [bfsQueue, setBfsQueue] = useState([]);
  // New states for leaf processing.
  const [processingLeaves, setProcessingLeaves] = useState(false);
  const [leafNodes, setLeafNodes] = useState([]);
  const [currentLeafIndex, setCurrentLeafIndex] = useState(0);
  const [leafValues, setLeafValues] = useState({});
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // Our steps for decomposition.
  const steps = [
    { id: "childrenCount", question: "Enter the number of children" },
    { id: "childrenDetails", question: "Enter details for each child" },
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

  // Load BFS queue from sessionStorage.
  useEffect(() => {
    const storedQueue = JSON.parse(sessionStorage.getItem("bfsQueue") || "[]");
    setBfsQueue(storedQueue);
    console.log("Initial BFS Queue:", storedQueue);
  }, []);

  // If no parentId is provided, fetch the root node.
  useEffect(() => {
    const fetchRoot = async () => {
      try {
        if (!parentId) {
          const res = await axios.get(
            `http://localhost:8000/api/projects/${projectId}`
          );
          if (res.data && res.data.id) {
            setParentId(res.data.id.toString());
            console.log(
              "Fetched root node. ParentId set to:",
              res.data.id.toString()
            );
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

  // When parentId changes, fetch parent's name.
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

  // Also update parentId if the URL changes.
  useEffect(() => {
    const pid = new URLSearchParams(location.search).get("parentId");
    if (pid) setParentId(pid);
  }, [location.search]);

  // Auto-scroll when step changes.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentStep, processingLeaves, currentLeafIndex]);

  // ----- STEP 0: Handle number of children -----
  const handleCountSubmit = () => {
    const count = parseInt(childrenCount);
    if (isNaN(count) || count < 2 || count > 5) {
      alert("Please enter a number between 2 and 5.");
      return;
    }
    const details = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: "",
      decompose: false,
    }));
    setChildrenDetails(details);
    setCurrentStep(1);
  };

  // ----- STEP 1: Handle child details changes -----
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...childrenDetails];
    newDetails[index][field] = field === "decompose" ? value === "true" : value;
    setChildrenDetails(newDetails);
  };

  // ----- Save Children & Update BFS Queue -----
  const saveChildren = async () => {
    const effectiveParentId = parentId;
    if (!effectiveParentId) {
      alert("Parent node is not set. Please try again.");
      return [];
    }

    const childrenNodes = childrenDetails.map((child, index) => ({
      id: `${effectiveParentId}-${Date.now()}-${index}`,
      name: child.name,
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
            decisionProcess: "DeMA",
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
      console.log("Created children from backend:", createdChildren);

      const nodesToDecompose = createdChildren.filter(
        (child) =>
          child.decompose === true ||
          (child.attributes && child.attributes.decompose === true)
      );
      console.log("Nodes to decompose:", nodesToDecompose);

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

  // ----- Process Children -----
  const handleProcessChildren = async () => {
    try {
      setProcessing(true);
      const updatedQueue = await saveChildren();
      if (updatedQueue && updatedQueue.length > 0) {
        const [nextNode, ...remaining] = updatedQueue;
        console.log("Processing next node in queue:", nextNode);
        sessionStorage.setItem("bfsQueue", JSON.stringify(remaining));
        setBfsQueue(remaining);
        setParentId(nextNode.id);
        setChildrenCount("");
        setChildrenDetails([]);
        setCurrentStep(0);
      } else {
        // No nodes left to decompose: finalize the tree.
        finalizeNode();
      }
    } catch (error) {
      console.error("Error processing Components:", error);
      alert("Failed to process Components nodes.");
    } finally {
      setProcessing(false);
    }
  };

  // ----- Finalize Node -----
  const finalizeNode = async () => {
    alert("All decompositions complete for this node! Finalizing tree.");
    window.dispatchEvent(new Event("refreshProjectTree"));
    setParentId(null);
    setChildrenCount("");
    setChildrenDetails([]);
    setCurrentStep(0);
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
    } catch (error) {
      console.error("Error fetching tree after finalizing:", error);
    }
  };

  // ----- Decide which view to render -----
  const renderStep = () => {
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
              alert("Finished processing all leaf nodes!");
              setProcessingLeaves(false);
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
    if (currentStep === 0) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md mx-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {steps[0].question} for{" "}
            <span className="text-indigo-600">{parentName}</span>
          </h2>
          <div className="flex items-center">
            <input
              type="number"
              value={childrenCount}
              onChange={(e) => setChildrenCount(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-1/4"
              min="2"
              max="5"
              placeholder="2 - 5"
            />
            <button
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleNextStep}
            >
              Continue
            </button>
          </div>
        </div>
      );
    } else if (currentStep === 1) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md mx-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {steps[1].question} for{" "}
            <span className="text-indigo-600">{parentName}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Component Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Decompose?
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {childrenDetails.map((child, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder={`Child ${index + 1} name`}
                        value={child.name}
                        onChange={(e) =>
                          handleDetailChange(index, "name", e.target.value)
                        }
                        className="border border-gray-300 rounded-lg p-2 w-full"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex rounded-md shadow-sm">
                        <button
                          onClick={() =>
                            handleDetailChange(index, "decompose", "true")
                          }
                          className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                            child.decompose
                              ? "bg-green-500 text-white"
                              : "bg-white text-gray-700 hover:bg-green-100"
                          } rounded-l-md`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() =>
                            handleDetailChange(index, "decompose", "false")
                          }
                          className={`px-4 py-2 border border-gray-300 text-sm font-medium ${
                            !child.decompose
                              ? "bg-red-500 text-white"
                              : "bg-white text-gray-700 hover:bg-red-100"
                          } rounded-r-md`}
                        >
                          No
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-6">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              onClick={handleBackStep}
            >
              Back
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={handleNextStep}
              disabled={processing}
            >
              {processing ? "Processing..." : "Process Components"}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      handleCountSubmit();
    } else if (currentStep === 1) {
      if (childrenDetails.some((child) => !child.name.trim())) {
        alert("Please fill in all Component names.");
        return;
      }
      handleProcessChildren();
    }
  };

  const handleBackStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="w-full h-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-gray-200 rounded-t-lg">
        <h1 className="text-xl font-bold text-gray-800">
          DeMA Decision Assistant
        </h1>
      </header>
      <main className="flex-1 p-4 overflow-y-auto">{renderStep()}</main>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default DemaChat;
