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

  if (!leafNodes || leafNodes.length === 0) return null;
  const currentLeaf = leafNodes[currentLeafIndex];

  const handleSelectComposition = (comp) => {
    setComposition(comp);
  };

  const handleSaveAndNext = () => {
    setComposition("");
    onNextLeaf();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h2 className="text-xl font-semibold mb-2">
        Evaluated item:{" "}
        <span className="text-indigo-600">{currentLeaf.name}</span>
      </h2>
      <p className="text-3xl text-red-600 mb-4">
        Please select one of the following 5 options.
      </p>
      {!composition ? (
        <>
          <div className="text-4xl flex flex-col gap-4">
            <button
              className="bg-gray-200 text-black px-8 py-4 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all"
              onClick={() => handleSelectComposition("q4")}
            >
              I prefer high values of this item
            </button>
            <button
              className="bg-gray-200 text-black px-8 py-4 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all"
              onClick={() => handleSelectComposition("q5")}
            >
              I prefer low values of this item
            </button>
            <button
              className="bg-gray-200 text-black px-8 py-4 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all"
              onClick={() => handleSelectComposition("q6")}
            >
              I prefer a specific range of values
            </button>
            <button
              className="bg-gray-200 text-black px-8 py-4 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all"
              onClick={() => handleSelectComposition("q7")}
            >
              I will specify a table of requirements
            </button>
            <button
              className="bg-gray-200 text-black px-8 py-4 rounded-lg shadow-sm hover:bg-gray-300 hover:shadow-md transition-all"
              onClick={() => handleSelectComposition("q13")}
            >
              I will select suitability from your table
            </button>
          </div>
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
