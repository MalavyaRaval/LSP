import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const Query4 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [values, setValues] = useState({
    from: "",
    to: "",
  });
  const [specificValues, setSpecificValues] = useState([]);
  const [error, setError] = useState("");
  const [showSpecificValue, setShowSpecificValue] = useState(false);

  // New state to store the ID of an existing query result
  const [queryResultId, setQueryResultId] = useState(null);

  useEffect(() => {
    // Reset form state when nodeName changes
    setValues({ from: "", to: "" });
    setSpecificValues([]);
    setShowSpecificValue(false);
    setQueryResultId(null);
    setError("");

    // console.log(
    //   "Query4: Fetching data for nodeName:",
    //   nodeName,
    //   "projectId:",
    //   projectId
    // );
    // console.log("Query4: nodeName type:", typeof nodeName, "value:", nodeName);

    const fetchExistingQueryResult = async () => {
      try {
        // console.log("Query4: Using nodeName for search:", nodeName);

        const response = await axiosInstance.get(
          `/api/queryResults?project=${projectId}&nodeName=${encodeURIComponent(
            nodeName
          )}`
        );
        // console.log("Query4: Response data:", response.data);
        if (response.data && response.data.length > 0) {
          // Filter results by the specific nodeName
          const existingResult = response.data.find(
            (result) => result.nodeName === nodeName
          );

          if (existingResult) {
            setQueryResultId(existingResult._id);
            // console.log(
            //   "Query4: Found existing result for nodeName:",
            //   existingResult.nodeName
            // );

            // Populate form fields with existing values
            if (existingResult.values) {
              // Set main form values
              if (existingResult.values.from && existingResult.values.to) {
                setValues({
                  from: existingResult.values.from.toString(),
                  to: existingResult.values.to.toString(),
                });
                // console.log(
                //   "Query4: Set values:",
                //   existingResult.values.from,
                //   existingResult.values.to
                // );
              }

              // Set specific values if they exist
              if (
                existingResult.values.specificPoints &&
                existingResult.values.specificPoints.length > 0
              ) {
                const processedSpecificValues =
                  existingResult.values.specificPoints.map((point) => ({
                    value: point.value.toString(),
                    satisfaction: (point.satisfaction * 100).toString(), // Convert back to percentage
                  }));
                setSpecificValues(processedSpecificValues);
                setShowSpecificValue(true);
                // console.log(
                //   "Query4: Set specific values:",
                //   processedSpecificValues
                // );
              }
            }
          } else {
            // console.log(
            //   "Query4: No existing data found for nodeName:",
            //   nodeName
            // );
          }
        } else {
          // console.log("Query4: No existing data found for nodeName:", nodeName);
        }
      } catch (err) {
        // console.error("Error fetching existing query result:", err);
      }
    };
    fetchExistingQueryResult();
  }, [nodeName, projectId]);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSpecificValueChange = (index, field, value) => {
    const newSpecificValues = [...specificValues];
    newSpecificValues[index][field] = value;
    setSpecificValues(newSpecificValues);
  };
  const addSpecificValue = () => {
    if (!showSpecificValue) {
      // Only add a new value if there are no existing specific values
      if (specificValues.length === 0) {
        setSpecificValues([{ value: "", satisfaction: "" }]);
      }
      setShowSpecificValue(true);
    } else {
      // Add a new specific value row
      setSpecificValues([...specificValues, { value: "", satisfaction: "" }]);
    }
  };

  const removeSpecificValue = (index) => {
    const newSpecificValues = [...specificValues];
    newSpecificValues.splice(index, 1);
    setSpecificValues(newSpecificValues);
    // Hide the section if no more specific values
    if (newSpecificValues.length === 0) {
      setShowSpecificValue(false);
    }
  };

  const validate = () => {
    const minValue = parseFloat(values.from);
    const maxValue = parseFloat(values.to);

    // Validate the min and max values
    if (isNaN(minValue) || isNaN(maxValue)) {
      setError("Please enter valid numbers for minimum and maximum values.");
      return false;
    }

    if (minValue >= maxValue) {
      setError("The minimum value must be less than the maximum value.");
      return false;
    }

    // Validate specific values if they exist
    if (specificValues.length > 0) {
      for (let i = 0; i < specificValues.length; i++) {
        const specificVal = parseFloat(specificValues[i].value);
        const satisfactionPct = parseFloat(specificValues[i].satisfaction);

        if (isNaN(specificVal)) {
          setError(`Please enter a valid number for specific value #${i + 1}.`);
          return false;
        }

        // Check if the specific value is between min and max
        if (specificVal <= minValue || specificVal >= maxValue) {
          setError(
            `Specific value #${
              i + 1
            } must be between ${minValue} and ${maxValue}.`
          );
          return false;
        }

        if (
          isNaN(satisfactionPct) ||
          satisfactionPct < 0 ||
          satisfactionPct > 100
        ) {
          setError(
            `Please enter a valid satisfaction percentage (0-100) for specific value #${
              i + 1
            }.`
          );
          return false;
        }
      }

      // Check if specific values are unique
      const uniqueValues = new Set(
        specificValues.map((v) => parseFloat(v.value))
      );
      if (uniqueValues.size !== specificValues.length) {
        setError("Each specific value must be unique.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const handleSaveQuery = async () => {
    if (!validate()) return;
    try {
      // Process specific values to match the format expected by scoreIncreasing
      const processedSpecificValues = specificValues.map((item) => ({
        value: parseFloat(item.value),
        satisfaction: parseFloat(item.satisfaction) / 100, // Convert to decimal for calculator
      }));

      // Build payload including nodeName and specific values
      const payload = {
        nodeId: nodeId.toString(), // Ensure nodeId is string
        nodeName,
        queryType: "q4",
        values: {
          from: values.from,
          to: values.to,
          specificPoints: processedSpecificValues,
        },
        projectId,
      };

      // console.log("Query4: Saving payload:", payload);

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
      console.error("Error saving Query4", err);
      setError("Failed to save query.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-xl mb-1" style={{ color: "#E53935" }}>
        Please specify your requirements, keeping in mind that the first value
        should always be less than the second.
      </h4>
      <table className="min-w-full border-collapse border border-gray-700 mb-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-xl border border-gray-700 p-1">
              Description of requirements
            </th>
            <th className="text-xl border border-gray-700 p-1">
              Numeric values
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-1">
              It is unacceptable if the given value is less than or equal to
            </td>
            <td className="border border-gray-700 p-1 w-32">
              <input
                type="number"
                name="from"
                value={values.from}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border-2 border-gray-800 rounded px-2 py-1 bg-white"
                style={{ fontSize: "1.5rem" }}
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-1">
              I am fully satisfied if the value is greater than or equal to
            </td>
            <td className="border border-gray-700 p-1 w-32">
              <input
                type="number"
                name="to"
                value={values.to}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border-2 border-gray-800 rounded px-2 py-1 bg-white"
                style={{ fontSize: "1.5rem" }}
              />
            </td>
          </tr>
          {/* Button for adding specific values */}
          <tr className="bg-gray-50 hover:bg-gray-100">
            <td colSpan="2" className="border border-gray-700 p-1">
              <div className="flex justify-between items-center">
                <button
                  className="text-lg font-bold bg-blue-500 hover:bg-blue-600 text-white px-1 py-1 rounded transition-all w-full text-center"
                  onClick={addSpecificValue}
                  disabled={!values.from || !values.to}
                  title={
                    !values.from || !values.to
                      ? "Please enter min and max values first"
                      : "Add specific values between min and max with their satisfaction levels"
                  }
                >
                  {showSpecificValue
                    ? "Optional condition to increase precision (press continue if not used)"
                    : "Optional condition to increase precision (press continue if not used)"}
                </button>
              </div>
            </td>
          </tr>
          {/* Specific values section */}
          {showSpecificValue &&
            specificValues.map((item, index) => (
              <React.Fragment key={index}>
                <tr className="bg-blue-50">
                  <td className="text-2xl border border-gray-700 p-1">
                    <div className="flex justify-between items-center">
                      <div className="flex-grow">
                        If the analyzed item has this value:
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpecificValue(index)}
                        className="ml-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                        title="Remove this specific value"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                  <td className="border border-gray-700 p-1 w-32">
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => {
                        handleSpecificValueChange(
                          index,
                          "value",
                          e.target.value
                        );
                      }}
                      onBlur={(e) => {
                        handleSpecificValueChange(
                          index,
                          "value",
                          e.target.value
                        );
                      }}
                      className="w-full border-2 border-gray-800 rounded px-2 py-1 bg-white"
                      style={{ fontSize: "1.5rem" }}
                      min={values.from ? parseFloat(values.from) + 0.01 : ""}
                      max={values.to ? parseFloat(values.to) - 0.01 : ""}
                      placeholder={
                        values.from && values.to ? `Enter value` : "Enter value"
                      }
                    />
                  </td>
                </tr>
                <tr className="bg-blue-50 border-t-0">
                  <td className="text-2xl border border-gray-700 p-1">
                    ... then my satisfaction degree is (%):
                  </td>
                  <td className="border border-gray-700 p-1 w-32">
                    <input
                      type="number"
                      value={item.satisfaction}
                      onChange={(e) => {
                        handleSpecificValueChange(
                          index,
                          "satisfaction",
                          e.target.value
                        );
                      }}
                      onBlur={(e) => {
                        handleSpecificValueChange(
                          index,
                          "satisfaction",
                          e.target.value
                        );
                      }}
                      min="0"
                      max="100"
                      className="w-full border-2 border-gray-800 rounded px-3 py-1 bg-white"
                      style={{ fontSize: "1.5rem" }}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          {/* Show a message if specific values section is visible but empty */}
          {showSpecificValue && specificValues.length === 0 && (
            <tr className="bg-blue-50">
              <td
                colSpan="2"
                className="border border-gray-700 p-1 text-center text-gray-500"
              >
                Click the "+ Add Value" button to add specific values between
                your min and max values
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {error && <p className="text-red-500 text-2xl font-bold">{error}</p>}
      <div className="flex justify-between mt-2">
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

export default Query4;
