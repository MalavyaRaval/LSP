import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";

// Helper: recursively extract leaf nodes (nodes with no children)
const getLeafNodes = (node) => {
  if (!node.children || node.children.length === 0) return [node];
  let leaves = [];
  node.children.forEach((child) => {
    leaves = leaves.concat(getLeafNodes(child));
  });
  return leaves;
};

const ModifyEvaluation = () => {
  const { projectname, evaluationId } = useParams();
  const navigate = useNavigate();
  const [evaluationStep, setEvaluationStep] = useState(1);
  const [alternativeName, setAlternativeName] = useState("");
  const [error, setError] = useState("");
  const [leafNodes, setLeafNodes] = useState([]);
  const [alternativeValues, setAlternativeValues] = useState({});
  const [queryResults, setQueryResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the evaluation data and project tree
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch the evaluation data
        const evalRes = await axiosInstance.get(
          `/api/evaluations?project=${projectname}`
        );
        const evaluation = evalRes.data.find(
          (evaluationItem) => evaluationItem._id === evaluationId
        );

        if (!evaluation) {
          throw new Error("Evaluation not found");
        }

        setAlternativeName(evaluation.alternativeName);
        setAlternativeValues(evaluation.alternativeValues || {});

        // Fetch the project tree
        const treeRes = await axiosInstance.get(`/api/projects/${projectname}`);
        const treeData = treeRes.data;
        const leaves = getLeafNodes(treeData);
        setLeafNodes(leaves);

        // Fetch query results
        const queryRes = await axiosInstance.get(
          `/api/query-results?project=${projectname}&_=${new Date().getTime()}`
        );
        setQueryResults(queryRes.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load evaluation data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [evaluationId, projectname]);

  const handleNextStep = async () => {
    if (!alternativeName.trim()) {
      setError("Please enter a valid name.");
      return;
    }

    // Check if alternative name already exists (excluding current evaluation)
    try {
      const res = await axiosInstance.get(
        `/api/evaluations?project=${projectname}`
      );
      const existingEvaluations = res.data;
      const nameExists = existingEvaluations.some(
        (evaluation) =>
          evaluation._id !== evaluationId &&
          evaluation.alternativeName.toLowerCase() ===
            alternativeName.trim().toLowerCase()
      );

      if (nameExists) {
        setError(
          "This alternative name already exists. Please choose a different name."
        );
        return;
      }
    } catch (err) {
      console.error("Error checking existing evaluations:", err);
    }

    setError("");
    setEvaluationStep(2);
  };

  const handleValueChange = (leafId, value) => {
    setAlternativeValues((prev) => ({
      ...prev,
      [leafId]: value,
    }));
  };

  const handleSubmit = async () => {
    const emptyLeaf = leafNodes.find(
      (leaf) => !alternativeValues[leaf.id]?.toString().trim()
    );
    if (emptyLeaf) {
      setError("Please fill in a value for all components.");
      return;
    }
    setError("");

    try {
      // Get the current evaluation to get its cost
      const evalRes = await axiosInstance.get(
        `/api/evaluations?project=${projectname}`
      );
      const currentEval = evalRes.data.find(
        (evaluation) => evaluation._id === evaluationId
      );

      if (!currentEval) {
        setError("Could not find the current evaluation");
        return;
      }

      const payload = {
        projectId: projectname,
        alternativeName,
        alternativeCost: currentEval.alternativeCost, // Maintain the original cost
        alternativeValues,
      };

      await axiosInstance.put(`/api/evaluations/${evaluationId}`, payload);
      navigate(`/project/${projectname}/evaluate`);
    } catch (err) {
      console.error("Error updating evaluation:", err);
      if (err.response && err.response.status === 409) {
        setError(
          "This alternative name already exists. Please choose a different name."
        );
      } else {
        setError("Failed to update evaluation.");
      }
    }
  };

  const handleCancel = () => {
    navigate(`/project/${projectname}/evaluate`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h1 className="text-2xl font-bold mb-4">Modify Evaluation</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alternative Name:
        </label>
        <input
          type="text"
          value={alternativeName}
          onChange={(e) => setAlternativeName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter alternative name"
        />
      </div>

      {error && (
        <p className="text-red-700 text-xl font-semibold mb-4">{error}</p>
      )}
      <div className="flex gap-4">
        <button
          onClick={handleNextStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Next
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h1 className="text-2xl font-bold mb-4">Modify Evaluation</h1>
      <div className="mb-4">
        <p className="m-0">
          <span className="font-medium">Alternative Name:</span>{" "}
          {alternativeName}
        </p>
      </div>
      <p className="text-red-700 m-0 leading-tight">
        Please enter the values of Attributes
      </p>
      {error && <p className="text-red-700 text-xl font-semibold">{error}</p>}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2">Attribute Name</th>
              <th className="border border-gray-300 p-2">
                The range of values
              </th>
              <th className="border border-gray-300 p-2">
                Values for {alternativeName}
              </th>
            </tr>
          </thead>
          <tbody>
            {leafNodes.map((leaf) => {
              const queryResult = queryResults.find(
                (qr) => qr.nodeId.toString() === leaf.id.toString()
              );

              return (
                <tr key={leaf.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 font-medium">
                    {leaf.name}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {queryResult ? (
                      <div>
                        {queryResult.queryType === "q4" && (
                          <>
                            <div>
                              Range: {queryResult.values.from}-
                              {queryResult.values.to}
                            </div>
                            <div>preferred high values</div>
                          </>
                        )}
                        {queryResult.queryType === "q5" && (
                          <>
                            <div>
                              Range: {queryResult.values.from}-
                              {queryResult.values.to}
                            </div>
                            <div>preferred low values</div>
                          </>
                        )}
                        {queryResult.queryType === "q6" && (
                          <>
                            <div>
                              Range: {queryResult.values.A}, (
                              {queryResult.values.B}, {queryResult.values.C}),{" "}
                              {queryResult.values.D}
                            </div>
                            <div>
                              preferred range {queryResult.values.B}-
                              {queryResult.values.C}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      "No query defined"
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      value={alternativeValues[leaf.id] || ""}
                      onChange={(e) =>
                        handleValueChange(leaf.id, e.target.value)
                      }
                      className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter value"
                      step="0.01"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Update Evaluation
        </button>
        <button
          onClick={() => setEvaluationStep(1)}
          className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return <div>{evaluationStep === 1 ? renderStep1() : renderStep2()}</div>;
};

export default ModifyEvaluation;
