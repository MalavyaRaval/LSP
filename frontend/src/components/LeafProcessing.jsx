import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Query4 from "./Query/Query4.jsx";
import Query5 from "./Query/Query5.jsx";
import Query6 from "./Query/Query6.jsx";

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
  };

  const toggleHelpPopup = (queryType) => {
    if (showHelpPopup === queryType) {
      setShowHelpPopup(null);
    } else {
      setShowHelpPopup(queryType);
    }
  };

  return (
    <div className="p-2 bg-white rounded-lg shadow-md mx-0">
      <h2 className="text-xl font-semibold mb-0">
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
            </div>{" "}
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
          </div>
          {showHelpPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-semibold text-blue-600">
                    Help Information
                  </h2>
                </div>
                <div className="mb-6">
                  <p className="text-gray-800 text-lg">
                    {helpContent[showHelpPopup]}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-6 rounded transition-all duration-300"
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
          )}{" "}
          {composition === "q6" && (
            <Query6
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
