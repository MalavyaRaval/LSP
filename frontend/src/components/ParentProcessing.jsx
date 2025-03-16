import React, { useState } from "react";
import axios from "axios"; // New import

const ParentProcessing = ({
  parentNodes,
  currentParentIndex,
  onNextParent,
  onPrevParent,
  projectId, // New prop for backend call
}) => {
  if (!parentNodes || parentNodes.length === 0) {
    return <div>No parent nodes to process.</div>;
  }
  const currentParent = parentNodes[currentParentIndex];
  const [values, setValues] = useState({
    importance: currentParent.attributes?.importance || "",
    connection: currentParent.attributes?.connection || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const importance = parseFloat(values.importance);
    const connection = parseFloat(values.connection);
    if (isNaN(importance) || isNaN(connection)) {
      setError("Please enter valid numbers for both fields.");
      return false;
    }
    if (importance < 1 || importance > 5 || connection < 1 || connection > 5) {
      setError("Values must be between 1 and 5.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSave = async () => {
    if (validate()) {
      try {
        // Clamp the values between 1 and 5.
        const imp = Math.max(1, Math.min(5, parseFloat(values.importance)));
        const con = Math.max(1, Math.min(5, parseFloat(values.connection)));
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
        <input
          type="number"
          name="importance"
          value={values.importance}
          onChange={handleChange}
          onBlur={validate}
          className="w-full border rounded px-2 py-1"
          min="2"
          max="5"
          placeholder="2 - 5"
        />
      </div>
      <div className="mb-4">
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Connection
        </label>
        <input
          type="number"
          name="connection"
          value={values.connection}
          onChange={handleChange}
          onBlur={validate}
          className="w-full border rounded px-2 py-1"
          min="2"
          max="5"
          placeholder="2 - 5"
        />
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
