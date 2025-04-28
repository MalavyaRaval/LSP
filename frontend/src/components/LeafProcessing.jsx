import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Query4 from "./Query/Query4.jsx";
import Query5 from "./Query/Query5.jsx";
import Query6 from "./Query/Query6.jsx";
import Query7 from "./Query/Query7.jsx";
import Query13 from "./Query/Query13.jsx";

const LeafProcessing = ({
  leafNodes,
  currentLeafIndex,
  onNextLeaf,
  onPrevLeaf,
}) => {
  const { username, projectname } = useParams();
  const [composition, setComposition] = useState(""); // holds the selected query e.g. "q4"
  const [showHelpPopup, setShowHelpPopup] = useState(null);

  if (!leafNodes || leafNodes.length === 0) return null;
  const currentLeaf = leafNodes[currentLeafIndex];

  const handleSelectComposition = (comp) => {
    setComposition(comp);
  };

  const handleSaveAndNext = () => {
    setComposition("");
    onNextLeaf();
  };

  const helpContent = {
    q4: "Choose this option when you prefer higher values for this attribute. For example, if evaluating car fuel efficiency, you'd prefer more miles per gallon.",
    q5: "Choose this option when you prefer lower values for this attribute. For example, if evaluating noise level, you'd prefer lower decibels.",
    q6: "Choose this option when you want a specific range of values, with declining suitability outside that range. For example, if room temperature should be between 68-72°F.",
    q7: "Choose this option to create a custom table that maps specific values to suitability percentages. Useful for attributes with multiple thresholds.",
    q13: "Choose this option to select from a pre-defined table of suitability values based on ranges. This is helpful when you have standard preference criteria.",
  };

  const toggleHelpPopup = (queryType) => {
    if (showHelpPopup === queryType) {
      setShowHelpPopup(null);
    } else {
      setShowHelpPopup(queryType);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h2 className="text-xl font-semibold mb-2">
        Evaluated item:{" "}
        <span className="text-indigo-600">{currentLeaf.name}</span>
      </h2>
      {!composition && (
        <p className="text-3xl text-red-600 mb-4">
          Please select one of the following 5 options.
        </p>
      )}
      {!composition ? (
        <>
          <div className="text-4xl flex flex-col gap-2">
            <div className="flex items-center">
              <button
                className="bg-gray-200 text-black px-6 py-2 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all flex-grow"
                onClick={() => handleSelectComposition("q4")}
              >
                I prefer high values of this item
              </button>
              <button
                className="ml-2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 text-xl font-bold"
                onClick={() => toggleHelpPopup("q4")}
              >
                ?
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="bg-gray-200 text-black px-6 py-2 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all flex-grow"
                onClick={() => handleSelectComposition("q5")}
              >
                I prefer low values of this item
              </button>
              <button
                className="ml-2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 text-xl font-bold"
                onClick={() => toggleHelpPopup("q5")}
              >
                ?
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="bg-gray-200 text-black px-6 py-2 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all flex-grow"
                onClick={() => handleSelectComposition("q6")}
              >
                I prefer a specific range of values
              </button>
              <button
                className="ml-2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 text-xl font-bold"
                onClick={() => toggleHelpPopup("q6")}
              >
                ?
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="bg-gray-200 text-black px-6 py-2 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all flex-grow"
                onClick={() => handleSelectComposition("q7")}
              >
                I will specify a table of requirements
              </button>
              <button
                className="ml-2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 text-xl font-bold"
                onClick={() => toggleHelpPopup("q7")}
              >
                ?
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="bg-gray-200 text-black px-6 py-2 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all flex-grow"
                onClick={() => handleSelectComposition("q13")}
              >
                I will select suitability from your table
              </button>
              <button
                className="ml-2 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-600 text-xl font-bold"
                onClick={() => toggleHelpPopup("q13")}
              >
                ?
              </button>
            </div>
          </div>

          {showHelpPopup && (
            <div className="fixed inset-0 bg-gray-700 bg-opacity-40 flex justify-center items-center z-50">
              <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    Help Information
                  </h3>
                  <button
                    className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300"
                    onClick={() => setShowHelpPopup(null)}
                  >
                    ✕
                  </button>
                </div>
                <p className="text-gray-700 text-lg">
                  {helpContent[showHelpPopup]}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    onClick={() => setShowHelpPopup(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {composition === "q4" && (
            <Query4
              onSave={handleSaveAndNext}
              nodeId={currentLeaf.id}
              projectId={projectname}
              nodeName={currentLeaf.name}
            />
          )}
          {composition === "q5" && (
            <Query5
              onSave={handleSaveAndNext}
              nodeId={currentLeaf.id}
              projectId={projectname}
              nodeName={currentLeaf.name}
            />
          )}
          {composition === "q6" && (
            <Query6
              onSave={handleSaveAndNext}
              nodeId={currentLeaf.id}
              projectId={projectname}
              nodeName={currentLeaf.name}
            />
          )}
          {composition === "q7" && (
            <Query7
              onSave={handleSaveAndNext}
              nodeId={currentLeaf.id}
              projectId={projectname}
              nodeName={currentLeaf.name}
            />
          )}
          {composition === "q13" && (
            <Query13
              onSave={handleSaveAndNext}
              nodeId={currentLeaf.id}
              projectId={projectname}
              nodeName={currentLeaf.name}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LeafProcessing;
