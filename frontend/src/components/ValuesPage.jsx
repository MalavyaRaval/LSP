import React from "react";
import { useLocation, Link } from "react-router-dom";

const ValuesPage = () => {
  const location = useLocation();
  const search = location.search;
  const queryParams = new URLSearchParams(search);
  const parentId = queryParams.get("parentId");
  const username = queryParams.get("username");
  const projectname = queryParams.get("projectname");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Values Page</h1>
      <div className="mb-6">
        <p className="text-lg">
          <strong>Parent ID:</strong> {parentId}
        </p>
        <p className="text-lg">
          <strong>Username:</strong> {username}
        </p>
        <p className="text-lg">
          <strong>Project Name:</strong> {projectname}
        </p>
      </div>
      <hr className="border-t-2 border-gray-300 mb-6" />
      <div>
        <h2 className="text-2xl font-bold mb-4">QUERY 3 QUESTIONS ANSWER</h2>
        <p className="mb-4">
          Specification of requirements that should be satisfied by the
          following item:
        </p>
        <p className="mb-4 font-semibold">Analyzed Item</p>
        <table className="min-w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-green-500 text-white">
              <th className="border border-gray-400 p-2">Option</th>
              <th className="border border-gray-400 p-2">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <Link to={`/q4${search}`} className="text-blue-500 underline">
                  Q4
                </Link>
              </td>
              <td className="border border-gray-400 p-2">
                I prefer high values of this item
              </td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <Link to={`/q5${search}`} className="text-blue-500 underline">
                  Q5
                </Link>
              </td>
              <td className="border border-gray-400 p-2">
                I prefer low values of this item
              </td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <Link to={`/q6${search}`} className="text-blue-500 underline">
                  Q6
                </Link>
              </td>
              <td className="border border-gray-400 p-2">
                I prefer a specific range of values
              </td>
            </tr>
            <tr className="hover:bg-gray-100">
              <td className="border border-gray-400 p-2">
                <Link to={`/q7${search}`} className="text-blue-500 underline">
                  Q7
                </Link>
              </td>
              <td className="border border-gray-400 p-2">
                I will specify a table of requirements
                <Link to={`/q13${search}`} className="text-blue-500 underline">
                  Q13
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValuesPage;
