import React, { useState } from "react";
import axios from "axios";

const Query6 = ({ onSave, nodeId, projectId, nodeName }) => {
  // State contains lower, middleLower, middleUpper, and upper
  const [values, setValues] = useState({
    lower: "",
    middleLower: "",
    middleUpper: "",
    upper: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const lower = parseFloat(values.lower);
    const middleLower = parseFloat(values.middleLower);
    const middleUpper = parseFloat(values.middleUpper);
    const upper = parseFloat(values.upper);
    if (
      isNaN(lower) ||
      isNaN(middleLower) ||
      isNaN(middleUpper) ||
      isNaN(upper)
    ) {
      setError("Please enter valid numbers in all fields.");
      return false;
    }
    // Validate that lower < middleLower < middleUpper < upper
    if (
      !(lower < middleLower && middleLower < middleUpper && middleUpper < upper)
    ) {
      setError("Ensure that lower < middle lower < middle upper < upper.");
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
          nodeName, // Pass nodeName in payload
          queryType: "q6",
          values, // Contains lower, middleLower, middleUpper, and upper
          projectId,
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
      <h4 className="text-2xl font-bold mb-2">
        Please answer the following, keeping in mind that the first value should
        always be less than the second.
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
              It is unacceptable if the value is less than
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="lower"
                value={values.lower}
                onChange={handleChange}
                onBlur={validate}
                className="w-full border rounded px-2 py-1"
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="border border-gray-400 p-2">
              I am fully satisfied if the offered value is between the following
              two values
            </td>
            <td className="border border-gray-400 p-2">
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="middleLower"
                  value={values.middleLower}
                  onChange={handleChange}
                  onBlur={validate}
                  placeholder="Lower bound"
                  className="w-1/2 border rounded px-2 py-1"
                />
                <input
                  type="number"
                  name="middleUpper"
                  value={values.middleUpper}
                  onChange={handleChange}
                  onBlur={validate}
                  placeholder="Upper bound"
                  className="w-1/2 border rounded px-2 py-1"
                />
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="border border-gray-400 p-2">
              It is unacceptable if the value is greater than
            </td>
            <td className="border border-gray-400 p-2">
              <input
                type="number"
                name="upper"
                value={values.upper}
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
        Continue
      </button>
    </div>
  );
};

export default Query6;
