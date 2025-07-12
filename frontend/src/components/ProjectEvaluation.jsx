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

const ProjectEvaluation = () => {
  const { projectname } = useParams();
  const navigate = useNavigate();
  const [evaluationStep, setEvaluationStep] = useState(1);
  const [alternativeName, setAlternativeName] = useState("");
  const [alternativeCost, setAlternativeCost] = useState("");
  const [error, setError] = useState("");
  const [leafNodes, setLeafNodes] = useState([]);
  const [alternativeValues, setAlternativeValues] = useState({});
  const [queryResults, setQueryResults] = useState([]);

  // In step 2, fetch the project tree and query results.
  useEffect(() => {
    if (evaluationStep === 2) {
      const fetchLeafNodes = async () => {
        try {
          const res = await axiosInstance.get(`/api/projects/${projectname}`);
          const treeData = res.data;
          const leaves = getLeafNodes(treeData);
          setLeafNodes(leaves);
          // Initialize alternativeValues for each leaf (using its id)
          const initialValues = {};
          leaves.forEach((leaf) => {
            initialValues[leaf.id] = "";
          });
          setAlternativeValues(initialValues);
        } catch (err) {
          console.error("Error fetching project tree:", err);
          setError("Failed to load leaf nodes.");
        }
      };

      const fetchQueryResults = async () => {
        try {
          const res = await axiosInstance.get(
            `/api/query-results?project=${projectname}&_=${new Date().getTime()}`
          );
          setQueryResults(res.data);
        } catch (err) {
          console.error("Error fetching query results:", err);
        }
      };

      fetchLeafNodes();
      fetchQueryResults();
    }
  }, [evaluationStep, projectname]);

  const handleNextStep = () => {
    if (!alternativeName.trim()) {
      setError("Please enter a valid name.");
      return;
    }
    const costNum = parseFloat(alternativeCost);
    if (isNaN(costNum) || costNum < 0) {
      setError("Please enter a positive number for cost.");
      return;
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
  const handleSubmitAndNext = async () => {
    const emptyLeaf = leafNodes.find(
      (leaf) => !alternativeValues[leaf.id]?.toString().trim()
    );
    if (emptyLeaf) {
      setError("Please fill in a value for all components.");
      return;
    }
    setError("");
    try {
      const payload = {
        projectId: projectname, // using projectname as project id
        user: "testing", // Use a fixed user
        alternativeName,
        alternativeCost: parseFloat(alternativeCost),
        alternativeValues, // object mapping each leaf id to a number
      };
      await axiosInstance.post("/api/evaluations", payload);
      handleConfirmYes();
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      setError("Failed to submit evaluation.");
    }
  };

  const handleSubmitAndEvaluate = async () => {
    const emptyLeaf = leafNodes.find(
      (leaf) => !alternativeValues[leaf.id]?.toString().trim()
    );
    if (emptyLeaf) {
      setError("Please fill in a value for all components.");
      return;
    }
    setError("");
    try {
      const payload = {
        projectId: projectname, // using projectname as project id
        user: "testing", // Use a fixed user
        alternativeName,
        alternativeCost: parseFloat(alternativeCost),
        alternativeValues, // object mapping each leaf id to a number
      };
      await axiosInstance.post("/api/evaluations", payload);
      handleConfirmNo();
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      setError("Failed to submit evaluation.");
    }
  };
  const handleConfirmYes = () => {
    // Reset the form for a new alternative entry.
    setAlternativeName("");
    setAlternativeCost("");
    setAlternativeValues({});
    setEvaluationStep(1);
  };
  const handleConfirmNo = () => {
    // Navigate to the summary page or re-evaluation page.
    navigate(`/project/${projectname}/evaluate`);
  };

  const renderStep2 = () => (
    <div className="p-6 bg-white rounded-lg shadow-md mx-4">
      <h1 className="text-2xl font-bold mb-4">Evaluation</h1>
      <div className="mb-4 flex gap-4">
        <p className="m-0">
          <span className="font-medium">Alternative Name:</span>
          {}
          {alternativeName}
        </p>
        <p className="m-0">
          <span className="font-medium">Cost:</span> {alternativeCost}
        </p>
      </div>
      <p className="text-red-700 m-0 leading-tight">
        Please enter the valuse of Attributes
      </p>
      {error && <p className="text-red-500">{error}</p>}
      {}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200">
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
              // Find query result for this leaf if available.
              const result = queryResults.find(
                (r) => r.nodeId === leaf.id || r.nodeName === leaf.name
              );
              let existingValue = "-";
              if (result) {
                if (
                  result.queryType === "q6" &&
                  result.values &&
                  result.values.A !== undefined &&
                  result.values.D !== undefined
                ) {
                  existingValue = `${result.values.A} to ${result.values.D}`;
                } else if (
                  result.values &&
                  result.values.from !== undefined &&
                  result.values.to !== undefined
                ) {
                  existingValue = `${result.values.from} to ${result.values.to}`;
                }
              }
              return (
                <tr key={leaf.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 p-2">{leaf.name}</td>
                  <td className="border border-gray-300 p-2">
                    {existingValue}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <input
                      type="number"
                      value={alternativeValues[leaf.id]}
                      onChange={(e) =>
                        handleValueChange(leaf.id, e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                      placeholder="Enter value"
                    />
                    {}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleSubmitAndNext}
          className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 shadow-xl transform hover:scale-105 min-w-[250px] flex items-center justify-center"
          style={{ fontSize: "2rem" }}
        >
          Next Competitor
        </button>
        <button
          onClick={handleSubmitAndEvaluate}
          className="text-3xl font-extrabold bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-green-800 transition-all duration-300 shadow-xl transform hover:scale-105 min-w-[250px] flex items-center justify-center"
          style={{ fontSize: "2rem" }}
        >
          Perform Evaluation
        </button>
      </div>
    </div>
  );

  if (evaluationStep === 1) {
    return (
      <div className="p-4 leading-tight space-y-2 bg-white rounded-lg shadow-md mx-4">
        <h1 className="text-2xl font-bold mb-2">Evaluation</h1>
        <p className="text-red-600 text-lg font-medium">
          Please specify a competitor
        </p>
        <div className="mt-4">
          <label className="block mb-2">Competitor Name:</label>
          <input
            type="text"
            value={alternativeName ?? ""}
            onChange={(e) => setAlternativeName(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full"
            placeholder="Enter alternative name"
          />
        </div>
        <div className="mt-4">
          <label className="block mb-2">Cost (Enter 0 if not used):</label>
          <input
            type="number"
            value={alternativeCost ?? ""}
            onChange={(e) => setAlternativeCost(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full"
            placeholder="Enter positive cost"
          />
        </div>
        {error && <p className="mt-2 text-red-500">{error}</p>}
        <button
          onClick={handleNextStep}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Next Step
        </button>
      </div>
    );
  }

  return renderStep2();
};

export default ProjectEvaluation;
