import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const Query6 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [values, setValues] = useState({
    lower: "",
    middleLower: "",
    middleUpper: "",
    upper: "",
  });
  const [error, setError] = useState("");

  // New state to store the ID of an existing query result
  const [queryResultId, setQueryResultId] = useState(null);

  useEffect(() => {
    const fetchExistingQueryResult = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/query-results?project=${projectId}&nodeId=${nodeId}`
        );
        if (response.data && response.data.length > 0) {
          const existingResult = response.data[0];
          setQueryResultId(existingResult._id);
        }
      } catch (err) {
        console.error("Error fetching existing query result:", err);
      }
    };
    fetchExistingQueryResult();
  }, [nodeId, projectId]);

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
    if (!validate()) return;
    try {
      const mappedValues = {
        A: values.lower, // unacceptable if less than
        B: values.middleLower, // start of fully satisfied
        C: values.middleUpper, // end of fully satisfied
        D: values.upper, // unacceptable if greater than
      };

      const payload = {
        nodeId,
        nodeName,
        queryType: "q6",
        values: mappedValues, // Send the mapped A,B,C,D values
        projectId,
      };

      if (queryResultId) {
        // If an existing result ID is found, use PUT to update
        await axiosInstance.put("/api/query-results", {
          ...payload,
          _id: queryResultId,
        });
      } else {
        // Otherwise, use POST to create a new one
        await axiosInstance.post("/api/query-results", payload);
      }
      onSave();
    } catch (err) {
      console.error("Error saving Query6", err);
      setError("Failed to save query result.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-xl mb-0" style={{ color: "#E53935" }}>
        Please specify your requirements, ensuring values are in ascending
        order.
      </h4>
      <table className="min-w-full border-collapse border border-gray-700 mb-0">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-xl border border-gray-700 p-2">
              Description of requirements
            </th>
            <th className="text-xl border border-gray-700 p-2">
              Your (numeric) values
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              It is unacceptable if the value is less than
            </td>
            <td className="border border-gray-700 p-2">
              <input
                type="number"
                name="lower"
                value={values.lower}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border rounded px-2 py-0"
                style={{ fontSize: "1.5rem" }}
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              I am fully satisfied if the offered value is between the following
              two values
            </td>
            <td className="border border-gray-700 p-2">
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="middleLower"
                  value={values.middleLower}
                  onChange={handleChange}
                  onBlur={handleChange}
                  placeholder="Lower bound"
                  className="w-1/2 border rounded px-2 py-0"
                  style={{ fontSize: "1.5rem" }}
                />
                <input
                  type="number"
                  name="middleUpper"
                  value={values.middleUpper}
                  onChange={handleChange}
                  onBlur={handleChange}
                  placeholder="Upper bound"
                  className="w-1/2 border rounded px-2 py-0"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              It is unacceptable if the value is greater than
            </td>
            <td className="border border-gray-700 p-2">
              <input
                type="number"
                name="upper"
                value={values.upper}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border rounded px-2 py-0"
                style={{ fontSize: "1.5rem" }}
              />
            </td>
          </tr>
        </tbody>
      </table>
      {error && <p className="text-red-500 text-3xl font-bold">{error}</p>}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => onSave("back")}
          className="text-lg font-extrabold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105"
          style={{ fontSize: "1.5rem" }}
        >
          Back
        </button>
        <button
          className="text-lg font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-lg transform hover:scale-105"
          onClick={handleSaveQuery}
          style={{ fontSize: "1.5rem" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Query6;
