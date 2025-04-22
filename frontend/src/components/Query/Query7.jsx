import React, { useState } from "react";
import axios from "axios";

const Query7 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [rows, setRows] = useState([
    { offered: "", satisfaction: "" },
    { offered: "", satisfaction: "" },
  ]);
  const [error, setError] = useState("");

  const handleChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { offered: "", satisfaction: "" }]);
  };

  const validateRows = () => {
    // Validate that each offered value is a valid number and
    // that they are in strictly increasing order.
    for (let i = 0; i < rows.length - 1; i++) {
      const current = parseFloat(rows[i].offered);
      const next = parseFloat(rows[i + 1].offered);
      if (isNaN(current) || isNaN(next)) {
        setError("Please enter valid numbers for all offered values.");
        return false;
      }
      if (current >= next) {
        setError("Offered values must be in strictly increasing order.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleSaveQuery = async () => {
    if (!validateRows()) return;

    // Transform rows into a range object:
    // Use the first row's offered value as "from" and
    // the last row's offered value as "to".
    const fromVal = rows[0].offered;
    const toVal = rows[rows.length - 1].offered;
    const transformedValues = { from: fromVal, to: toVal };

    try {
      const payload = {
        nodeId,
        nodeName,
        queryType: "q7",
        values: transformedValues,
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
            <th className="text-2xl border border-gray-400 p-2">
              Provide values
            </th>
            <th className="text-2xl border border-gray-400 p-2">
              Degree of Satisfaction (%)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <input
                  type="number"
                  value={row.offered}
                  onChange={(e) =>
                    handleChange(index, "offered", e.target.value)
                  }
                  onBlur={validateRows}
                  className="w-full border rounded px-2 py-1"
                  style={{ fontSize: "1.75rem" }}
                />
              </td>
              <td className="border border-gray-400 p-2">
                <input
                  type="number"
                  value={row.satisfaction}
                  onChange={(e) =>
                    handleChange(index, "satisfaction", e.target.value)
                  }
                  className="w-full border rounded px-2 py-1"
                  style={{ fontSize: "1.75rem" }}
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
