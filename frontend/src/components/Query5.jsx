import React, { useState } from "react";
import axios from "axios";

const Query5 = ({ onSave, nodeId }) => {
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
    if (validate()) {
      try {
        await axios.post("http://localhost:8000/api/query-results", {
          nodeId,
          queryType: "q5",
          values,
        });
        onSave();
      } catch (err) {
        setError("Failed to save query result.");
        console.error(err);
      }
    }
  };

  return (
    <div className="p-4 border rounded">
      <h1 className="text-2xl font-bold mb-2">
        Query 5: I prefer low values of this item
      </h1>
      <p className="mb-4">
        Please answer the following. The first value must be less than the
        second.
      </p>
      <table className="min-w-full border-collapse border border-gray-400 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 p-2">Description</th>
            <th className="border border-gray-400 p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="border border-gray-400 p-2">
              I am fully satisfied if the value is less than
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
              It is unacceptable if the value is greater than
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

export default Query5;
