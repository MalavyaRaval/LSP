import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";
import ConnectionProcessing from "./ConnectionProcessing.jsx";
import RelativeImportance from "./RelativeImportance.jsx";
import ProjectTree from "./ProjectTree.jsx";

const ParentProcessing = ({
  parentNodes,
  currentParentIndex,
  onNextParent,
  onPrevParent,
  projectId,
}) => {
  if (!parentNodes || parentNodes.length === 0) {
    return <div>No parent nodes to process.</div>;
  }
  const currentParent = parentNodes[currentParentIndex];

  const [step, setStep] = useState(1);
  const [values, setValues] = useState({
    connection: currentParent.attributes?.connection || "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setStep(1); // Always start with connection step
    setValues({
      connection: currentParent.attributes?.connection || "",
    });
    setError("");
  }, [currentParent]);

  const handleSaveConnection = async (connectionValue) => {
    try {
      // Always save connection for all nodes, including root
      await axiosInstance.put(
        `/api/projects/${projectId}/nodes/${currentParent.id}`,
        {
          attributes: {
            ...currentParent.attributes,
            connection: connectionValue,
          },
        }
      );
      setStep(2);
    } catch (err) {
      console.error("Failed to update parent node:", err);
      setError("Failed to update node. Please try again.");
    }
  };

  return (
    <div className="p-0 bg-white rounded-lg shadow-md h-full">
      <h2 className="text-xl font-semibold mb-0 mt-0">
        For : <span className="text-indigo-700">{currentParent.name}</span>
      </h2>
      {step === 1 ? (
        <div className="flex flex-row gap-1 w-full h-full">
          <div className="w-[55%] h-full">
            <ConnectionProcessing
              onComplete={handleSaveConnection}
              currentParent={currentParent}
              projectId={projectId}
            />
          </div>
          <div className="w-[45%] bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">
              {" "}
              Components for Evaluation
            </h2>
            <ProjectTree
              projectId={projectId}
              highlightedNodeId={currentParent.id}
            />
          </div>
        </div>
      ) : (
        <RelativeImportance
          currentParent={currentParent}
          projectId={projectId}
          onComplete={onNextParent}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
};

export default ParentProcessing;
