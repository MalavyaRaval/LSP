import React, { useState } from "react";
import axios from "axios";

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

  // Levels: 9 is Highest and 1 is Lowest.
  const levels = [
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

  const [values, setValues] = useState({
    importance: currentParent.attributes?.importance || "",
    connection: currentParent.attributes?.connection || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const importance = parseInt(values.importance, 10);
    const connection = parseInt(values.connection, 10);
    if (isNaN(importance) || isNaN(connection)) {
      setError("Please select valid levels for both fields.");
      return false;
    }
    if (importance < 1 || importance > 9 || connection < 1 || connection > 9) {
      setError("Values must be between 1 and 9.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (validate()) {
      try {
        // Ensure the numerical values are within 1 to 9.
        const imp = Math.max(1, Math.min(9, parseInt(values.importance, 10)));
        const con = Math.max(1, Math.min(9, parseInt(values.connection, 10)));
        // Update the node in the backend.
        await axios.put(
          `http://localhost:8000/api/projects/${projectId}/nodes/${currentParent.id}`,
          { attributes: { importance: imp, connection: con } }
        );
        onNextParent();
      } catch (err) {
        console.error("Failed to update parent node:", err);
        setError("Failed to update node. Please try again.");
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h2 className="text-xl font-semibold mb-4">
        Process Parent Node:{" "}
        <span className="text-indigo-600">{currentParent.name}</span>
      </h2>
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
          {levels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Connection
        </label>
        <select
          name="connection"
          value={values.connection}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select Level</option>
          {levels.map((level) => (
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleSave}
        >
          Save and Next
        </button>
      </div>
    </div>
  );
};

export default ParentProcessing;
