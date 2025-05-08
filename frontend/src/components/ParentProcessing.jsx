import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";
import ConnectionProcessing from "./ConnectionProcessing.jsx";

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
    setStep(1);
    setValues({
      importance: currentParent.attributes?.importance || "",
      connection: currentParent.attributes?.connection || "",
    });
    setError("");
  }, [currentParent]);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const imp = parseInt(values.importance, 10);
      await axiosInstance.put(
        `/api/projects/${projectId}/nodes/${currentParent.id}`,
        { attributes: { importance: imp, connection: values.connection } }
      );
      onNextParent();
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
      ) : (
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
              onClick={handleSave}
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ParentProcessing;
