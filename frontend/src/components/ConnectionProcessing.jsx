import React, { useState, useEffect } from "react";
import {
  getConnectionOptions,
  getLabelForConnection,
} from "./utils/connectionConverter";
import axiosInstance from "./utils/axiosInstance";

const connectionLogicOptions = [
  {
    value: "opt1",
    label:
      "All requirements are mandatory and must be simultaneously highly satisfied",
    marker: "Q1",
    connectionType: "HC",
  },
  {
    value: "opt2",
    label: "High satisfaction  of requirements is desirable  but not mandatory",
    marker: "Q2",
    connectionType: "SC",
  },
  {
    value: "opt3",
    label: "Desirable good satisfaction of most requirements",
    autoConnection: "A",
  },
  {
    value: "opt4",
    label:
      "Components can substitute each other with high values outweighing low values",
    marker: "Q4",
    connectionType: "SD",
  },
  {
    value: "opt5",
    label:
      "Any single component requirement is sufficient for the complete satisfaction of this criterion",
    marker: "Q5",
    connectionType: "HD",
  },
  {
    value: "opt6",
    label: "Combining mandatory and optional requirements",
    marker: "Q6",
    connectionType: "CPA",
  },
];

// Helper function to convert impact levels to penalty/reward values
const getImpactValues = (impactLevel) => {
  const impactMappings = {
    low: { penalty: 0.1, reward: 0.05 },
    medium: { penalty: 0.2, reward: 0.1 },
    high: { penalty: 0.3, reward: 0.15 },
  };
  return impactMappings[impactLevel] || impactMappings.medium;
};

const ConnectionProcessing = ({
  onComplete,
  currentParent,
  projectId,
  onBack,
}) => {
  const [step, setStep] = useState(1);
  const [selectedLogic, setSelectedLogic] = useState(null);
  const [children, setChildren] = useState([]);
  const [partialAbsorptionSelections, setPartialAbsorptionSelections] =
    useState({});
  const [impactLevel, setImpactLevel] = useState("medium");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [helpModalContent, setHelpModalContent] = useState("");
  const [hasExistingConnection, setHasExistingConnection] = useState(false);
  const [continueError, setContinueError] = useState("");

  // Check if current parent has existing connection
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        const response = await axiosInstance.get(`/api/projects/${projectId}`);
        const treeData = response.data;

        // Find the current parent in the tree
        const findNodeById = (node, id) => {
          if (node.id?.toString() === id.toString()) return node;
          if (!node.children || node.children.length === 0) return null;
          for (let child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
          }
          return null;
        };

        const parentNode = findNodeById(treeData, currentParent.id);
        if (
          parentNode &&
          parentNode.attributes &&
          parentNode.attributes.connection
        ) {
          setHasExistingConnection(true);
        } else {
          setHasExistingConnection(false);
        }
        setContinueError("");
      } catch (err) {
        console.error("Error checking existing connection:", err);
        setHasExistingConnection(false);
      }
    };

    checkExistingConnection();
  }, [currentParent.id, projectId]);

  // Reset state when currentParent changes (new node being processed)
  useEffect(() => {
    setStep(1);
    setSelectedLogic(null);
    setChildren([]);
    setPartialAbsorptionSelections({});
    setImpactLevel("medium");
  }, [currentParent]);

  // Fetch children when we need to show partial absorption selection
  useEffect(() => {
    if (step === 3 && currentParent && projectId) {
      fetchChildren();
    }
  }, [step, currentParent, projectId]);

  const fetchChildren = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}`);
      const treeData = response.data;

      // Find the current parent in the tree and get its children
      const findNodeById = (node, id) => {
        if (node.id?.toString() === id.toString()) return node;
        if (!node.children || node.children.length === 0) return null;
        for (let child of node.children) {
          const found = findNodeById(child, id);
          if (found) return found;
        }
        return null;
      };

      const parentNode = findNodeById(treeData, currentParent.id);
      if (parentNode && parentNode.children) {
        setChildren(parentNode.children);

        // Initialize partial absorption selections with existing values
        const initialSelections = {};
        parentNode.children.forEach((child) => {
          initialSelections[child.id] =
            child.attributes?.partialabsorption || "";
        });
        setPartialAbsorptionSelections(initialSelections);
      }
    } catch (err) {
      console.error("Error fetching children:", err);
    }
  };

  const handleLogicSelect = (option) => {
    setSelectedLogic(option);
    setContinueError(""); // Clear any previous errors
    if (option.autoConnection) {
      onComplete(option.autoConnection);
    } else if (option.value === "opt6") {
      // For CPA (opt6), go directly to partial absorption selection
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleConnectionSelect = (connection) => {
    onComplete(connection);
  };

  const handleContinue = () => {
    if (hasExistingConnection) {
      // If there's an existing connection, we can proceed to the next step
      // This would typically be handled by the parent component
      // For now, we'll just call onComplete with the existing connection
      const existingConnection = currentParent.attributes?.connection;
      if (existingConnection) {
        onComplete(existingConnection);
      }
      setContinueError("");
    } else {
      setContinueError(
        "Please select one of the logic conditions before continuing."
      );
    }
  };

  const handleHelpClick = (connectionType, connectionValue) => {
    // This is where we'll dynamically set the content based on connectionType and connectionValue
    let content = "Default help text.";
    if (connectionType === "SC") {
      if (connectionValue === "SC+") {
        content =
          "High desirable satisfaction (SC+): All components being satisfied is desirable but not mandatory. The overall satisfaction is highly influenced by the components with the highest satisfaction, effectively prioritizing strengths. However, very low values in some components can still drag down the overall score.";
      } else if (connectionValue === "SC") {
        content =
          "Medium desirable satisfaction (SC): All components being satisfied is desirable but not mandatory. The overall satisfaction is a balanced consideration of all components. It aims for a good average while allowing for some variations.";
      } else if (connectionValue === "SC-") {
        content =
          "Low desirable satisfaction (SC-): All components being satisfied is desirable but not mandatory. This option provides the most flexibility, with the overall satisfaction being less sensitive to individual component performance. It is suitable when a general trend of satisfaction across components is sufficient.";
      }
    } else if (connectionType === "HC") {
      if (connectionValue === "HC++") {
        content =
          "Extreme simultaneous satisfaction (HC++): For this option, all components are mandatory and must be simultaneously highly satisfied. The overall satisfaction is determined by the *minimum* satisfaction level among all components. This means even a single component with a low value will significantly penalize the overall satisfaction. It is suitable when all requirements are critical and must be met at the highest level.";
      } else if (connectionValue === "HC+") {
        content =
          "High simultaneous satisfaction (HC+): All components are mandatory and must be simultaneously highly satisfied. The overall satisfaction heavily depends on all components performing well. While not as strict as HC++, low values in individual components will still lead to a substantial reduction in overall satisfaction.";
      } else if (connectionValue === "HC") {
        content =
          "Medium simultaneous satisfaction (HC): All components are mandatory and should be simultaneously satisfied. The overall satisfaction is a balanced aggregation of all component satisfactions. Low values have a noticeable, but not extreme, negative impact.";
      } else if (connectionValue === "HC-") {
        content =
          "Low simultaneous satisfaction (HC-): All components are mandatory, but there's more tolerance for variations in individual satisfaction levels. The overall satisfaction considers all components, but a single low value will have a less severe impact compared to higher HC options.";
      }
    } else if (connectionType === "SD") {
      if (connectionValue === "SD+") {
        content =
          "High substitutive satisfaction (SD+): Components can substitute each other with high values significantly outweighing low values. This option provides the most flexibility for compensation, allowing strong performance in some components to effectively compensate for weaker performance in others.";
      } else if (connectionValue === "SD") {
        content =
          "Medium substitutive satisfaction (SD): Components can substitute each other with high values outweighing low values. This provides a balanced approach to compensation, where good performance in some components can help offset poor performance in others.";
      } else if (connectionValue === "SD-") {
        content =
          "Low substitutive satisfaction (SD-): Components can substitute each other, but the compensation effect is more limited. High values have a reduced ability to compensate for low values, making this option more conservative in terms of substitution.";
      }
    } else if (connectionType === "HD") {
      if (connectionValue === "HD++") {
        content =
          "Highest contributive satisfaction (HD++): Any single fully satisfied component is sufficient for the compound requirement, and a very strong positive impact is given to components that are highly satisfied. This is ideal when a single outstanding performance can carry the entire requirement.";
      } else if (connectionValue === "HD+") {
        content =
          "High contributive satisfaction (HD+): Any single fully satisfied component is sufficient for the compound requirement. High-performing components contribute significantly to the overall satisfaction, allowing one strong component to make a big difference.";
      } else if (connectionValue === "HD") {
        content =
          "Medium contributive satisfaction (HD): Any single fully satisfied component is sufficient for the compound requirement. Good performance in individual components contributes positively to the overall satisfaction, but the impact is more balanced across all components.";
      } else if (connectionValue === "HD-") {
        content =
          "Low contributive satisfaction (HD-): Any single fully satisfied component is sufficient for the compound requirement, but the positive impact from highly satisfied individual components is less pronounced. It still allows for single component sufficiency but reduces the reward for exceptionally high performance.";
      }
    } else if (connectionType === "A") {
      content =
        "Arithmetic Mean (A): Good satisfaction of most component requirements is appreciated, and the overall satisfaction is calculated as a simple average of individual component satisfactions. This option provides a straightforward, unbiased aggregation where all components contribute equally to the final score.";
    }

    setHelpModalContent(content);
    setIsHelpModalOpen(true);
  };

  const closeHelpModal = () => {
    setIsHelpModalOpen(false);
    setHelpModalContent("");
  };

  const handlePartialAbsorptionChange = (childId, value) => {
    setPartialAbsorptionSelections((prev) => ({
      ...prev,
      [childId]: value,
    }));
  };
  const handleSavePartialAbsorption = async () => {
    try {
      // Check if all children have selections
      const allChildrenHaveSelections = children.every(
        (child) =>
          partialAbsorptionSelections[child.id] &&
          partialAbsorptionSelections[child.id] !== ""
      );

      if (!allChildrenHaveSelections) {
        alert("Please select Mandatory or Optional for all child components.");
        return;
      }

      // Save partial absorption selections for each child (without penalty/reward)
      for (const child of children) {
        const selection = partialAbsorptionSelections[child.id];
        await axiosInstance.put(
          `/api/projects/${projectId}/nodes/${child.id}`,
          {
            attributes: {
              ...child.attributes,
              partialabsorption: selection,
            },
          }
        );
      }

      // Save penalty/reward on the parent node that will have CPA connection
      const impactValues = getImpactValues(impactLevel);
      await axiosInstance.put(
        `/api/projects/${projectId}/nodes/${currentParent.id}`,
        {
          attributes: {
            ...currentParent.attributes,
            connection: "CPA",
            penaltyreward: {
              penalty: impactValues.penalty,
              reward: impactValues.reward,
            },
          },
        }
      );

      // Complete with CPA connection
      onComplete("CPA");
    } catch (err) {
      console.error("Failed to save partial absorption selections:", err);
      alert("Failed to save selections. Please try again.");
    }
  };
  return (
    <>
      {step === 1 && (
        <>
          <p className="leading-tight text-red-700 mt-0 text-2xl mb-0">
            Select the logic condition for combining components:
          </p>
          <div className="px-4">
            <ul className="flex flex-col gap-3 pl-0 list-none ml-0">
              {connectionLogicOptions.map((option) => (
                <li key={option.value}>
                  <button
                    className={
                      option.value === "opt6"
                        ? "w-full text-left p-2 border rounded bg-gray-800 hover:bg-black text-white transition text-lg font-bold"
                        : "w-full text-left p-2 border rounded bg-gray-200 hover:bg-gray-300 transition text-lg font-bold"
                    }
                    onClick={() => handleLogicSelect(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {continueError && (
            <p className="text-red-500 text-xl font-bold mt-2">
              {continueError}
            </p>
          )}
          <div className="flex justify-between mt-4">
            <button
              onClick={onBack}
              className="text-lg font-extrabold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontSize: "1.5rem" }}>Back</span>
            </button>
            <button
              onClick={handleContinue}
              className="text-lg font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105"
            >
              <span style={{ fontSize: "1.5rem" }}>
                {hasExistingConnection ? "Continue" : "Continue"}
              </span>
            </button>
          </div>
        </>
      )}
      {step === 2 && selectedLogic && (
        <>
          <h2 className="font-semibold leading-tight mb-1">
            Select the desired degree of simultaneous satisfaction:
          </h2>
          {/* Show logic summary for selected connection type */}
          {selectedLogic && selectedLogic.connectionType && (
            <div className="mb-3 text-lg text-blue-800 font-semibold">
              {selectedLogic.connectionType === "HC" && (
                <span>All requirements must be satisfied.</span>
              )}
              {selectedLogic.connectionType === "SC" && (
                <span>
                  High satisfaction of requirements is desirable but not
                  mandatory.
                </span>
              )}
              {selectedLogic.connectionType === "SD" && (
                <span>
                  Components can substitute each other; high values can
                  compensate for low values.
                </span>
              )}
              {selectedLogic.connectionType === "HD" && (
                <span>
                  Any single component requirement is sufficient for complete
                  satisfaction.
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col items-center gap-3 w-full">
            {getConnectionOptions(selectedLogic.connectionType).map(
              (connection) => (
                <div
                  key={connection}
                  className="flex items-center gap-2 w-11/12 justify-center"
                >
                  <button
                    className="w-full text-2xl font-bold text-center p-3 border rounded-lg bg-gray-200 hover:bg-gray-300 transition shadow-md"
                    onClick={() => handleConnectionSelect(connection)}
                  >
                    {getLabelForConnection(connection)}
                  </button>
                  <button
                    className="p-2 border rounded bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 flex items-center justify-center font-bold text-2xl shadow-md"
                    onClick={() =>
                      handleHelpClick(selectedLogic.connectionType, connection)
                    }
                  >
                    ?
                  </button>
                </div>
              )
            )}
          </div>
        </>
      )}
      {step === 3 && selectedLogic && selectedLogic.value === "opt6" && (
        <>
          <h2 className="font-semibold leading-tight mb-3 text-red-900 text-2xl !text-red-800">
            Select <span className="underline">mandatory</span> or{" "}
            <span className="underline">optional</span> for each component:
          </h2>
          <p className="text-lg text-gray-800 mb-2">
            Mandatory components must be satisfied, optional components can be
            either satisfied or not satisfied
          </p>
          {children.length === 0 ? (
            <div className="text-center text-lg text-gray-600 py-2">
              No child components found. Please add components first.
            </div>
          ) : (
            <div className="space-y-1">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="border border-gray-200 rounded-lg p-1 bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 leading-tight">
                        {child.nodeNumber || "N/A"} {child.name}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <select
                        value={partialAbsorptionSelections[child.id] || ""}
                        onChange={(e) =>
                          handlePartialAbsorptionChange(
                            child.id,
                            e.target.value
                          )
                        }
                        className="border border-gray-300 rounded-lg px-3 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                      >
                        <option value="">Select...</option>
                        <option value="Mandatory">Mandatory</option>
                        <option value="Optional">Optional</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Impact Level Configuration */}
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-2xl font-semibold text-red-900 mb-2 !text-red-800">
                  Select the level of impact of optional components
                </h3>
                <div className="w-full max-w-2xl">
                  <div className="flex gap-4 justify-center">
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md min-w-[120px] justify-center">
                      <input
                        type="radio"
                        name="impactLevel"
                        value="low"
                        checked={impactLevel === "low"}
                        onChange={(e) => setImpactLevel(e.target.value)}
                        className="mr-2 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg font-semibold">Low</span>
                    </label>
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md min-w-[120px] justify-center">
                      <input
                        type="radio"
                        name="impactLevel"
                        value="medium"
                        checked={impactLevel === "medium"}
                        onChange={(e) => setImpactLevel(e.target.value)}
                        className="mr-2 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg font-semibold">Medium</span>
                    </label>
                    <label className="flex items-center p-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md min-w-[120px] justify-center">
                      <input
                        type="radio"
                        name="impactLevel"
                        value="high"
                        checked={impactLevel === "high"}
                        onChange={(e) => setImpactLevel(e.target.value)}
                        className="mr-2 w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg font-semibold">High</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() => setStep(1)}
                  className="text-xl font-extrabold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Back
                </button>

                <button
                  onClick={handleSavePartialAbsorption}
                  className="text-xl font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg mx-auto">
            <h3 className="text-xl font-bold mb-4">Help Information</h3>
            <p className="text-gray-700">{helpModalContent}</p>
            <div className="flex justify-end">
              <button
                onClick={closeHelpModal}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectionProcessing;
