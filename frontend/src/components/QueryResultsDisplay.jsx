import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import Footer from "./Footer";

const QueryResultsDisplay = () => {
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const { projectname } = useParams();

  const fetchResults = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/query-results?project=${projectname}`
      );
      setResults(res.data);
    } catch (err) {
      setError("Failed to fetch query results.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [projectname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-1 container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Query Results</h1>
        {error && <p className="text-red-500">{error}</p>}
        {results.length === 0 ? (
          <p>No query results found.</p>
        ) : (
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Node ID</th>
                <th className="border border-gray-300 p-2">Values</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                let valuesStr = "-";
                if (result.queryType === "q6") {
                  // For query6, display lower and upper values as "lower-upper"
                  if (
                    result.values &&
                    result.values.lower !== undefined &&
                    result.values.upper !== undefined
                  ) {
                    valuesStr = `${result.values.lower} - ${result.values.upper}`;
                  }
                } else {
                  // For other query types, use the original format.
                  if (
                    result.values &&
                    result.values.from !== undefined &&
                    result.values.to !== undefined
                  ) {
                    valuesStr = `${result.values.from} to ${result.values.to}`;
                  }
                }
                return (
                  <tr key={result._id} className="hover:bg-gray-100">
                    <td className="border border-gray-300 p-2">
                      {result.nodeName}
                    </td>
                    <td className="border border-gray-300 p-2">{valuesStr}</td>
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
