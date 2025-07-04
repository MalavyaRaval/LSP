import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

const Query5 = ({ onSave, nodeId, projectId, nodeName }) => {
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
      // Hide the section and clear values when toggling off
      setShowSpecificValue(false);
      setSpecificValues([]);
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
      setError("First value (min) must be less than second value (max).");
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
      // Process specific values to match the format expected by scoreDecreasing
      const processedSpecificValues = specificValues.map((item) => ({
        value: parseFloat(item.value),
        satisfaction: parseFloat(item.satisfaction) / 100, // Convert to decimal for calculator
      }));

      // Build payload including nodeName and specific values
      const payload = {
        nodeId,
        nodeName,
        queryType: "q5",
        values: {
          from: values.from,
          to: values.to,
          specificPoints: processedSpecificValues,
        },
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
      console.error("Error saving Query5", err);
      setError("Failed to save query.");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-2xl mb-2" style={{ color: "#E53935" }}>
        Please specify your requirements, keeping in mind that the first value
        should always be less than the second.
      </h4>
      <table className="min-w-full border-collapse border border-gray-700 mb-4">
        <thead>
          <tr className="bg-gray-200">
            <th className="text-2xl border border-gray-700 p-2">
              Description of requirements
            </th>
            <th className="text-2xl border border-gray-700 p-2">
              Your (numeric) values
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              I am fully satisfied if the value is less than or equal to
            </td>
            <td className="border border-gray-700 p-2">
              <input
                type="number"
                name="from"
                value={values.from}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border rounded px-2 py-1"
                style={{ fontSize: "1.75rem" }}
              />
            </td>
          </tr>
          <tr className="hover:bg-gray-100">
            <td className="text-2xl border border-gray-700 p-2">
              It is unacceptable if the value is greater than or equal to
            </td>
            <td className="border border-gray-700 p-2">
              <input
                type="number"
                name="to"
                value={values.to}
                onChange={handleChange}
                onBlur={handleChange}
                className="w-full border rounded px-2 py-1"
                style={{ fontSize: "1.75rem" }}
              />
            </td>
          </tr>
          {/* Button for adding specific values */}
          <tr className="bg-gray-50 hover:bg-gray-100">
            <td colSpan="2" className="border border-gray-700 p-2">
              <div className="flex justify-between items-center">
                <button
                  className="text-xl font-bold bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded transition-all w-full"
                  onClick={addSpecificValue}
                  disabled={!values.from || !values.to}
                  title={
                    !values.from || !values.to
                      ? "Please enter min and max values first"
                      : showSpecificValue
                      ? "Click to remove specific value"
                      : "Add specific values between min and max with their satisfaction levels"
                  }
                >
                  {showSpecificValue
                    ? "Optional Condition to Increase Precision ( Close optional condition if not used)"
                    : "Optional Condition to Increase Precision"}
                </button>
              </div>
            </td>
          </tr>
          {/* Specific values section */}
          {showSpecificValue &&
            specificValues.map((item, index) => (
              <React.Fragment key={index}>
                <tr className="bg-blue-50">
                  <td className="text-2xl border border-gray-700 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-grow">
                        If the analyzed item has this value:
                      </div>
                      <button
                        onClick={() => removeSpecificValue(index)}
                        className="text-red-500 hover:text-red-700 text-xl ml-4"
                        title="Remove this value"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                  <td className="border border-gray-700 p-4">
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
                      className="w-full border rounded px-3 py-2"
                      style={{ fontSize: "1.75rem" }}
                      min={values.from ? parseFloat(values.from) + 0.01 : ""}
                      max={values.to ? parseFloat(values.to) - 0.01 : ""}
                      placeholder={
                        values.from && values.to
                          ? `Between ${values.from} and ${values.to}`
                          : "Enter value"
                      }
                    />
                  </td>
                </tr>
                <tr className="bg-blue-50 border-t-0">
                  <td className="text-2xl border border-gray-700 p-4">
                    Then my satisfaction degree is (%):
                  </td>
                  <td className="border border-gray-700 p-4">
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
                      className="w-full border rounded px-3 py-2"
                      style={{ fontSize: "1.75rem" }}
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
                className="border border-gray-700 p-2 text-center text-gray-500"
              >
                Click the "+ Add Value" button to add specific values between
                your min and max values
              </td>
            </tr>
          )}
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

export default Query5;
