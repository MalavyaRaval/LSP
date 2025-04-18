import React, { useState } from "react";
import axios from "axios";

const Query4 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [values, setValues] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const firstNum = parseFloat(values.from);
    const secondNum = parseFloat(values.to);
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
      <h4 className="text-2xl mb-2" style={{ color: "#E53935" }}>
        Please specify your requirements, keeping in mind that the first value
        should always be less than the second.
      </h4>
      <table className="min-w-full border-collapse border border-gray-400 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-2xl border border-gray-400 p-2">
              Description of requirements
            </th>
            <th className="text-2xl border border-gray-400 p-2">
              Your (numeric) values
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-400 p-2">
              It is unacceptable if the given value is less than
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="from"
                value={values.from}
                onChange={handleChange}
                onBlur={validate}
                className="w-full border rounded px-2 py-1"
                style={{ fontSize: "1.75rem" }} // Inline style to enforce larger font size
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-400 p-2">
              I am fully satisfied if the value is greater than
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="to"
                value={values.to}
                onChange={handleChange}
                onBlur={validate}
                className="w-full border rounded px-2 py-1"
                style={{ fontSize: "1.75rem" }} // Inline style to enforce larger font size
              />
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex justify-end mt-4">
        <div className="flex justify-end mt-4">
          <button
            className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-xl transform hover:scale-105 min-w-[250px] flex items-center justify-center"
            onClick={handleSaveQuery}
            style={{ fontSize: "2rem" }} // Force large font size with inline style
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Query4;
