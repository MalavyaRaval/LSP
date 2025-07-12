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
    // Reset form state when nodeName changes
    setValues({ lower: "", middleLower: "", middleUpper: "", upper: "" });
    setQueryResultId(null);
    setError("");

    // console.log(
    //   "Query6: Fetching data for nodeName:",
    //   nodeName,
    //   "projectId:",
    //   projectId
    // );
    // console.log("Query6: nodeName type:", typeof nodeName, "value:", nodeName);

    const fetchExistingQueryResult = async () => {
      try {
        // console.log("Query6: Using nodeName for search:", nodeName);

        const response = await axiosInstance.get(
          `/api/queryResults?project=${projectId}&nodeName=${encodeURIComponent(
            nodeName
          )}`
        );
        // console.log("Query6: Response data:", response.data);
        if (response.data && response.data.length > 0) {
          // Filter results by the specific nodeName
          const existingResult = response.data.find(
            (result) => result.nodeName === nodeName
          );

          if (existingResult) {
            setQueryResultId(existingResult._id);
            // console.log(
            //   "Query6: Found existing result for nodeName:",
            //   existingResult.nodeName
            // );

            // Populate form fields with existing values
            if (existingResult.values) {
              // For Query6, the values are stored as A, B, C, D
              if (
                existingResult.values.A &&
                existingResult.values.B &&
                existingResult.values.C &&
                existingResult.values.D
              ) {
                setValues({
                  lower: existingResult.values.A.toString(),
                  middleLower: existingResult.values.B.toString(),
                  middleUpper: existingResult.values.C.toString(),
                  upper: existingResult.values.D.toString(),
                });
                // console.log(
                //   "Query6: Set values:",
                //   existingResult.values.A,
                //   existingResult.values.B,
                //   existingResult.values.C,
                //   existingResult.values.D
                // );
              }
            }
          } else {
            // console.log(
            //   "Query6: No existing data found for nodeName:",
            //   nodeName
            // );
          }
        } else {
          // console.log("Query6: No existing data found for nodeName:", nodeName);
        }
      } catch (err) {
        console.error("Error fetching existing query result:", err);
      }
    };
    fetchExistingQueryResult();
  }, [nodeName, projectId]);

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
        nodeId: nodeId.toString(), // Ensure nodeId is string
        nodeName,
        queryType: "q6",
        values: mappedValues, // Send the mapped A,B,C,D values
        projectId,
      };

      // console.log("Query6: Saving payload:", payload);

      if (queryResultId) {
        // If an existing result ID is found, use PUT to update
        await axiosInstance.put("/api/queryResults", {
          ...payload,
          _id: queryResultId,
        });
      } else {
        // Otherwise, use POST to create a new one
        await axiosInstance.post("/api/queryResults", payload);
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
              Numeric values
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              It is unacceptable if the value is less than
            </td>
            <td className="border border-gray-700 p-2 w-32">
              <input
                type="number"
                name="lower"
                value={values.lower}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border-2 border-gray-800 rounded px-2 py-1 bg-white"
                style={{ fontSize: "1.5rem" }}
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              I am fully satisfied if the offered value is between the following
              two values
            </td>
            <td className="border border-gray-700 p-2 w-32">
              <div className="flex space-x-2">
                <input
                  type="number"
                  name="middleLower"
                  value={values.middleLower}
                  onChange={handleChange}
                  onBlur={handleChange}
                  placeholder="Lower bound"
                  className="w-1/2 border-2 border-gray-800 rounded px-2 py-1 bg-white"
                  style={{ fontSize: "1.5rem" }}
                />
                <input
                  type="number"
                  name="middleUpper"
                  value={values.middleUpper}
                  onChange={handleChange}
                  onBlur={handleChange}
                  placeholder="Upper bound"
                  className="w-1/2 border-2 border-gray-800 rounded px-2 py-1 bg-white"
                  style={{ fontSize: "1.5rem" }}
                />
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              It is unacceptable if the value is greater than
            </td>
            <td className="border border-gray-700 p-2 w-32">
              <input
                type="number"
                name="upper"
                value={values.upper}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border-2 border-gray-800 rounded px-2 py-1 bg-white"
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
