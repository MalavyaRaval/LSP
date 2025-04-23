import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import Footer from "./Footer";

const QueryResultsDisplay = () => {
  const [results, setResults] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [error, setError] = useState("");
  const { projectname } = useParams();

  const fetchResults = async () => {
    try {
      const [resultsRes, treeRes] = await Promise.all([
        axios.get(
          `http://localhost:8000/api/query-results?project=${projectname}`
        ),
        axios.get(`http://localhost:8000/api/projects/${projectname}`),
      ]);
      setResults(resultsRes.data);
      setTreeData(treeRes.data);
    } catch (err) {
      setError("Failed to fetch data.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [projectname]);

  // Function to get all nodes in tree order
  const getNodesInOrder = (node, resultsList = []) => {
    if (!node) return resultsList;

    // Add current node to list
    resultsList.push({
      id: node.id,
      name: node.name,
      nodeNumber: node.nodeNumber || "1",
    });

    // Recursively add children in order
    if (node.children) {
      node.children.forEach((child) => getNodesInOrder(child, resultsList));
    }

    return resultsList;
  };

  // Find query result for a node
  const getNodeResult = (nodeId) => {
    return results.find((result) => result.nodeName === nodeId);
  };

  // Format values string
  const formatValues = (result) => {
    if (!result) return "-";
    let valuesStr = "-";
    if (result.queryType === "q6") {
      if (
        result.values &&
        result.values.lower !== undefined &&
        result.values.upper !== undefined
      ) {
        valuesStr = `${result.values.lower} - ${result.values.upper}`;
      }
    } else {
      if (
        result.values &&
        result.values.from !== undefined &&
        result.values.to !== undefined
      ) {
        valuesStr = `${result.values.from} to ${result.values.to}`;
      }
    }
    return valuesStr;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Query Results</h1>
        {error && <p className="text-red-500">{error}</p>}
        {!treeData ? (
          <p>Loading...</p>
        ) : (
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Node Number</th>
                <th className="border border-gray-300 p-2">Node Name</th>
                <th className="border border-gray-300 p-2">Values</th>
              </tr>
            </thead>
            <tbody>
              {getNodesInOrder(treeData).map((node) => {
                const result = getNodeResult(node.id);
                return (
                  <tr key={node.id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2">
                      {node.nodeNumber}
                    </td>
                    <td className="border border-gray-300 p-2">{node.name}</td>
                    <td className="border border-gray-300 p-2">
                      {formatValues(result)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default QueryResultsDisplay;
