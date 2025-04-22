import React, { useState } from "react";
import axios from "axios";

const Query13 = ({ onSave, nodeId, projectId, nodeName }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [error, setError] = useState("");

  // Define the suitability options with their corresponding percentage values
  const suitabilityOptions = [
    { label: "Excellent", value: 100 },
    { label: "Very good", value: 87.5 },
    { label: "Good", value: 75 },
    { label: "Above average", value: 62.5 },
    { label: "Average", value: 50 },
    { label: "Below average", value: 37.5 },
    { label: "Poor", value: 25 },
    { label: "Very poor", value: 12.5 },
    { label: "Unacceptable", value: 0 },
  ];

  const handleSaveQuery = async () => {
    if (!selectedOption) {
      setError("Please select a suitability option.");
      return;
    }

    try {
      // Find the numeric value for the selected option
      const selectedValue = suitabilityOptions.find(
        (option) => option.label === selectedOption
      )?.value;

      await axios.post("http://localhost:8000/api/query-results", {
        nodeId,
        nodeName,
        queryType: "q13",
        values: {
          suitabilityLabel: selectedOption,
          suitabilityValue: selectedValue,
        },
        projectId,
      });
      onSave();
    } catch (err) {
      setError("Failed to save query result.");
      console.error(err);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h4 className="text-2xl font-bold mb-4">
        QUERY 13: Select the most appropriate degree of suitability
      </h4>
      <p className="text-lg mb-4">
        Please select the most appropriate degree of suitability (or
        satisfaction or truth) using the following options:
      </p>

      <div className="mb-6">
        <table className="min-w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-3">
                Qualitative Description
              </th>
              <th className="border border-gray-400 p-3">Quantitative Value</th>
              <th className="border border-gray-400 p-3">Select</th>
            </tr>
          </thead>
          <tbody>
            {suitabilityOptions.map((option) => (
              <tr key={option.label} className="hover:bg-gray-100">
                <td className="border border-gray-400 p-3 text-lg">
                  {option.label}
                </td>
                <td className="border border-gray-400 p-3 text-lg">
                  {option.value}%
                </td>
                <td className="border border-gray-400 p-3">
                  <div className="flex justify-center">
                    <input
                      type="radio"
                      name="suitability"
                      value={option.label}
                      checked={selectedOption === option.label}
                      onChange={() => setSelectedOption(option.label)}
                      className="w-5 h-5"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

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

export default Query13;
