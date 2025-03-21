import React, { useState } from "react";
import axios from "axios";

const Query4 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [values, setValues] = useState({ first: "", second: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const firstNum = parseFloat(values.first);
    const secondNum = parseFloat(values.second);
    if (isNaN(firstNum) || isNaN(secondNum)) {
      setError("Please enter valid numbers.");
      return false;
    }
    if (firstNum >= secondNum) {
      setError("First value must be less than second value.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSaveQuery = async () => {
    if (!validate()) return;
    try {
      // Build payload including nodeName
      const payload = {
        nodeId,
        nodeName, // include nodeName here
        queryType: "q4",
        values,
        projectId,
      };
      await axios.post("http://localhost:8000/api/query-results", payload);
      onSave();
    } catch (err) {
      console.error("Error saving Query4", err);
      setError("Failed to save query.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-2xl font-bold mb-2">
        You’ve mentioned that you prefer Higher values. Let’s clarify your
        preferences. Please answer the following, keeping in mind that the first
        value should always be less than the second.
      </h4>
      <table className="min-w-full border-collapse border border-gray-400 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-2">Description</th>
            <th className="border border-gray-400 p-2">Provide values</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="border border-gray-400 p-2">
              What’s the minimum acceptable value?
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="first"
                value={values.first}
                onChange={handleChange}
                onBlur={validate}
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="border border-gray-400 p-2">
              What value would make you fully satisfied?
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="second"
                value={values.second}
                onChange={handleChange}
                onBlur={validate}
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="text-red-500">{error}</p>}
      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleSaveQuery}
      >
        Save and Next
      </button>
    </div>
  );
};

export default Query4;
