import React, { useState } from "react";
import axios from "axios";

const Query7 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [rows, setRows] = useState([
    { value: "", percentage: "" },
    { value: "", percentage: "" },
  ]);
  const [error, setError] = useState("");

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { value: "", percentage: "" }]);
  };

  const validateRows = () => {
    // Validate that each value is a valid number and they are in increasing order
    for (let i = 0; i < rows.length; i++) {
      const value = parseFloat(rows[i].value);
      const percentage = parseFloat(rows[i].percentage);

      if (isNaN(value) || isNaN(percentage)) {
        setError("Please enter valid numbers for all fields.");
        return false;
      }

      if (percentage < 0 || percentage > 100) {
        setError("Satisfaction percentage must be between 0 and 100.");
        return false;
      }

      if (i > 0 && value <= parseFloat(rows[i - 1].value)) {
        setError("Values must be in strictly increasing order.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSaveQuery = async () => {
    if (!validateRows()) return;

    try {
      // Transform rows to match the format needed for scoreBasedOnRange
      const transformedRows = rows.map((row) => ({
        value: parseFloat(row.value),
        percentage: parseFloat(row.percentage) / 100, // Convert percentage to decimal
      }));

      const payload = {
        nodeId,
        nodeName,
        queryType: "q7",
        values: {
          points: transformedRows,
          from: transformedRows[0].value,
          to: transformedRows[transformedRows.length - 1].value,
        },
        projectId,
      };
      await axios.post("http://localhost:8000/api/query-results", payload);
      onSave();
    } catch (err) {
      console.error("Error saving Query7", err);
      setError("Failed to save query result.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-2xl mb-2" style={{ color: "#E53935" }}>
        Please specify your requirements with values in ascending order.
      </h4>
      <table className="min-w-full border-collapse border border-gray-400 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-2xl border border-gray-400 p-2">Value</th>
            <th className="text-2xl border border-gray-400 p-2">
              Satisfaction (0-100%)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <input
                  type="number"
                  value={row.value}
                  onChange={(e) => handleChange(index, "value", e.target.value)}
                  onBlur={validateRows}
                  className="w-full border rounded px-2 py-1"
                  style={{ fontSize: "1.75rem" }}
                  placeholder="Enter value"
                />
              </td>
              <td className="border border-gray-400 p-2">
                <input
                  type="number"
                  value={row.percentage}
                  onChange={(e) =>
                    handleChange(index, "percentage", e.target.value)
                  }
                  onBlur={validateRows}
                  min="0"
                  max="100"
                  className="w-full border rounded px-2 py-1"
                  style={{ fontSize: "1.75rem" }}
                  placeholder="0-100"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={addRow}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xl font-bold"
      >
        Add Row
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <div className="flex justify-end mt-4">
        <button
          className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-xl transform hover:scale-105 min-w-[250px] flex items-center justify-center"
          onClick={handleSaveQuery}
          style={{ fontSize: "2rem" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Query7;
