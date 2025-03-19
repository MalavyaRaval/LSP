import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Query4 from "./Query4.jsx";
import Query5 from "./Query5.jsx";
import Query6 from "./Query6.jsx";
import Query7 from "./Query7.jsx";

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
      <h2 className="text-xl font-semibold mb-4">
        For this item{" "}
        <span className="text-indigo-600">{currentLeaf.name}</span>
      </h2>
      {!composition ? (
        <>
          <p className="mb-4">
            How would you like to approach the composition?
          </p>
          <div className="flex flex-col gap-3">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => handleSelectComposition("q4")}
            >
              I prefer high values
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => handleSelectComposition("q5")}
            >
              I prefer low values
            </button>
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              onClick={() => handleSelectComposition("q6")}
            >
              I prefer a specific range
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={() => handleSelectComposition("q7")}
            >
              I will specify a table of requirements
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
        </>
      )}
      <div className="flex justify-start mt-6">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          onClick={onPrevLeaf}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default LeafProcessing;
