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
    <div className="p-2 border rounded">
      <p className="text-lg mb-0">
        Please select the most appropriate degree of suitability using the
        following options:
      </p>

      <div className="mb-0 overflow-auto">
        <table className="min-w-full border-collapse border border-gray-400 text-xl">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-1">
                Qualitative Description
              </th>
              <th className="border border-gray-400 p-1">Quantitative Value</th>
              <th className="border border-gray-400 p-1">Select</th>
            </tr>
          </thead>
          <tbody>
            {suitabilityOptions.map((option) => (
              <tr key={option.label} className="hover:bg-gray-100">
                <td className="border border-gray-400 p-1 text-lg">
                  {option.label}
                </td>
                <td className="border border-gray-400 p-1 text-lg">
                  {option.value}%
                </td>
                <td className="border border-gray-400 p-1">
                  <div className="flex justify-center">
                    <input
                      type="radio"
                      name="suitability"
                      value={option.label}
                      checked={selectedOption === option.label}
                      onChange={() => setSelectedOption(option.label)}
                      className="w-4 h-4"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <p className="text-red-500 mb-1 text-base">{error}</p>}

      <div className="flex justify-end">
        <button
          className="text-xl font-bold bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-1 rounded hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow transform hover:scale-105 min-w-[200px] flex items-center justify-center"
          onClick={handleSaveQuery}
          style={{ fontSize: "1.5rem" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Query13;
