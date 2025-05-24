import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const Query4 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [values, setValues] = useState({
    from: "",
    to: "",
  });
  const [specificValues, setSpecificValues] = useState([]);
  const [error, setError] = useState("");
  const [showSpecificValue, setShowSpecificValue] = useState(false);

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
        nodeId,
        nodeName,
        queryType: "q4",
        values: {
          from: values.from,
          to: values.to,
          specificPoints: processedSpecificValues,
        },
        projectId,
      };
      await axiosInstance.post("/api/query-results", payload);
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
                style={{ fontSize: "1.75rem" }}
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
                style={{ fontSize: "1.75rem" }}
              />
            </td>
          </tr>{" "}
          {/* Button for adding specific values */}
          <tr className="bg-gray-50 hover:bg-gray-100">
            <td colSpan="2" className="border border-gray-400 p-2">
              <div className="flex justify-between items-center">
                {" "}                <button
                  className="text-2xl font-bold bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded transition-all w-full"
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
                    ? "Optional Condition to Increase Precision"
                    : "Optional Condition to Increase Precision"}
                </button>
              </div>
            </td>
          </tr>
          {/* Specific values section */}
          {showSpecificValue &&
            specificValues.map((item, index) => (
              <React.Fragment key={index}>
                {" "}
                <tr className="bg-blue-50">
                  <td className="text-2xl border border-gray-400 p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex-grow">
                        If the analyzed item has this value:
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-400 p-2">
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) =>
                        handleSpecificValueChange(
                          index,
                          "value",
                          e.target.value
                        )
                      }
                      onBlur={validate}
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
                  <td className="text-2xl border border-gray-400 p-4">
                    ... then my satisfaction degree  is (%):
                  </td>
                  <td className="border border-gray-400 p-2">
                    <input
                      type="number"
                      value={item.satisfaction}
                      onChange={(e) =>
                        handleSpecificValueChange(
                          index,
                          "satisfaction",
                          e.target.value
                        )
                      }
                      onBlur={validate}
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
                className="border border-gray-400 p-2 text-center text-gray-500"
              >
                Click the "+ Add Value" button to add specific values between
                your min and max values
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {error && <p className="text-red-500 text-xl">{error}</p>}
      <div className="flex justify-end mt-4">
        <button
          className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-xl transform hover:scale-105 min-w-[250px] flex items-center justify-center"
          onClick={handleSaveQuery}
          style={{ fontSize: "2rem" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Query4;
