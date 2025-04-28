import React, { useState } from "react";
import {
  getConnectionOptions,
  getLabelForConnection,
} from "./utils/connectionConverter";

const connectionLogicOptions = [
  {
    value: "opt1",
    label:
      "All components are mandatory and must be simultaneously highly satisfied.",
    marker: "Q1",
    connectionType: "HC",
  },
  {
    value: "opt2",
    label: "All components satisfied is desirable but not mandatory.",
    marker: "Q2",
    connectionType: "SC",
  },
  {
    value: "opt3",
    label: "Good satisfaction of most component requirements is appreciated.",
    autoConnection: "A",
  },
  {
    value: "opt4",
    label:
      "Components can substitute each other with high values outweighing negatives.",
    marker: "Q4",
    connectionType: "SD",
  },
  {
    value: "opt5",
    label:
      "Any single fully satisfied component is sufficient for the compound requirement.",
    marker: "Q5",
    connectionType: "HD",
  },
];

const ConnectionProcessing = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedLogic, setSelectedLogic] = useState(null);

  const handleLogicSelect = (option) => {
    setSelectedLogic(option);
    if (option.autoConnection) {
      onComplete(option.autoConnection);
    } else {
      setStep(2);
    }
  };

  const handleConnectionSelect = (connection) => {
    onComplete(connection);
  };

  return (
    <div className="p-2 bg-white rounded shadow-md mx-2 text-2xl">
      {step === 1 && (
        <div>
          <p className="leading-tight mb-1 text-red-700">
            Select the logic requirement for the components:
          </p>
          <ul className="space-y-1">
            {connectionLogicOptions.map((option) => (
              <li key={option.value}>
                <button
                  className="w-full text-left p-2 border rounded bg-gray-200 hover:bg-gray-300 transition"
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
          <h2 className="font-semibold leading-tight mb-1">
            Select the intensity level:
          </h2>
          <div className="flex flex-col gap-1">
            {getConnectionOptions(selectedLogic.connectionType).map(
              (connection) => (
                <button
                  key={connection}
                  className="p-1 border rounded bg-gray-200 hover:bg-gray-300 transition"
                  onClick={() => handleConnectionSelect(connection)}
                >
                  {getLabelForConnection(connection)} ({connection})
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionProcessing;
