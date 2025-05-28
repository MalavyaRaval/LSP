import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";
import ConnectionProcessing from "./ConnectionProcessing.jsx";
import RelativeImportance from "./RelativeImportance.jsx";

const ParentProcessing = ({
  parentNodes,
  currentParentIndex,
  onNextParent,
  onPrevParent,
  projectId,
}) => {
  if (!parentNodes || parentNodes.length === 0) {
    return <div>No parent nodes to process.</div>;
  }
  const currentParent = parentNodes[currentParentIndex];

  // Check if current parent is the root (has no parent)
  const isRoot = !currentParent.parent;

  const levelsImportance = [
    { value: 9, label: "Highest" },
    { value: 8, label: "Very high" },
    { value: 7, label: "High" },
    { value: 6, label: "Medium-high" },
    { value: 5, label: "Medium" },
    { value: 4, label: "Medium-low" },
    { value: 3, label: "Low" },
    { value: 2, label: "Very low" },
    { value: 1, label: "Lowest" },
  ];
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    importance: currentParent.attributes?.importance || "",
    connection: currentParent.attributes?.connection || "",
  });
  const [error, setError] = useState("");
  useEffect(() => {
    // For root node, skip connection step and go directly to importance
    if (isRoot) {
      setStep(2);
      setValues({
        importance: currentParent.attributes?.importance || "",
        connection: "", // Root doesn't need connection
      });
    } else {
      setStep(1);
      setValues({
        importance: currentParent.attributes?.importance || "",
        connection: currentParent.attributes?.connection || "",
      });
    }
    setError("");
  }, [currentParent, isRoot]);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const handleSaveImportance = async () => {
    try {
      const imp = parseInt(values.importance, 10);

      // For root nodes, don't send connection; for non-root nodes, include connection
      const attributesToUpdate = isRoot
        ? { importance: imp }
        : { importance: imp, connection: values.connection };

      await axiosInstance.put(
        `/api/projects/${projectId}/nodes/${currentParent.id}`,
        { attributes: attributesToUpdate }
      );
      // Move to step 3 (RelativeImportance) instead of finishing
      setStep(3);
    } catch (err) {
      console.error("Failed to update parent node:", err);
      setError("Failed to update node. Please try again.");
    }
  };
  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h2 className="text-xl font-semibold mb-4">
        For : <span className="text-indigo-600">{currentParent.name}</span>
      </h2>
      {step === 1 ? (
        <ConnectionProcessing
          onComplete={(connectionValue) => {
            setValues({ ...values, connection: connectionValue });
            setStep(2);
          }}
        />
      ) : step === 2 ? (
        <>
          <div className="mb-4">
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Importance
            </label>
            <select
              name="importance"
              value={values.importance}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Select Level</option>
              {levelsImportance.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-between mt-6">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={onPrevParent}
              disabled={currentParentIndex === 0}
            >
              Back
            </button>
            <button
              className="text-xl bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleSaveImportance}
            >
              Continue
            </button>
          </div>
        </>
      ) : (
        <RelativeImportance
          currentParent={currentParent}
          projectId={projectId}
          onComplete={onNextParent}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
};

export default ParentProcessing;
