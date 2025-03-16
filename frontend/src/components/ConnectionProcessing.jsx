import React, { useState } from "react";

const connectionLogicOptions = [
  {
    value: "opt1",
    label:
      "All components are mandatory and must be simultaneously highly satisfied. It is not acceptable to have a single component requirement not satisfied.",
    marker: "Q9",
  },
  {
    value: "opt2",
    label:
      "Simultaneously high satisfaction of all components is desirable but not mandatory. We can tolerate the cases where some input requirements are not satisfied.",
    marker: "Q10",
  },
  {
    value: "opt3",
    label:
      "Nice to have a good satisfaction of most component requirements. (Auto-set connection = 4)",
    autoConnection: 4,
  },
  {
    value: "opt4",
    label:
      "These components can effectively substitute each other. The positive impact of large input values is stronger than the negative impact of small input values.",
    marker: "Q10",
  },
  {
    value: "opt5",
    label:
      "It is enough to have any input highly satisfied. A single fully satisfied component requirement is sufficient to fully satisfy the compound requirement.",
    marker: "Q9",
  },
];

const query9Options = [
  { value: 8, label: "Highest" },
  { value: 7, label: "High" },
  { value: 6, label: "Medium" },
  { value: 5, label: "Low" },
];

const query10Options = [
  { value: 3, label: "High" },
  { value: 2, label: "Medium" },
  { value: 1, label: "Low" },
];

const ConnectionProcessing = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedLogic, setSelectedLogic] = useState(null);

  const handleLogicSelect = (option) => {
    setSelectedLogic(option);
    if (option.autoConnection !== undefined) {
      // Option 3: auto assign connection, then complete process immediately
      onComplete(option.autoConnection);
    } else {
      // Move to intensity selection if marker exists.
      setStep(2);
    }
  };

  const handleIntensitySelect = (value) => {
    onComplete(value);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Components of{" "}
            <span className="text-indigo-600">{`<analyzed item>`}</span>
          </h2>
          <p className="mb-4">
            Select the most appropriate logic requirement that should be
            satisfied by the listed components. Your choice:
          </p>
          <ul className="space-y-4">
            {connectionLogicOptions.map((option) => (
              <li key={option.value}>
                <button
                  className="w-full text-left p-4 border rounded-lg hover:bg-gray-100 transition"
                  onClick={() => handleLogicSelect(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 2 && selectedLogic && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {selectedLogic.marker === "Q9" ? "QUERY 9" : "QUERY 10"} <br />
            Select the most appropriate intensity for the connection:
          </h2>
          <div className="flex flex-col space-y-4">
            {(selectedLogic.marker === "Q9"
              ? query9Options
              : query10Options
            ).map((opt) => (
              <button
                key={opt.value}
                className="p-4 border rounded-lg hover:bg-gray-100 transition"
                onClick={() => handleIntensitySelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionProcessing;
