import React, { useState, useEffect } from "react";
import axiosInstance from "./utils/axiosInstance";

const RelativeImportance = ({
  currentParent,
  projectId,
  onComplete,
  onBack,
}) => {
  const [children, setChildren] = useState([]);
  const [childrenImportance, setChildrenImportance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const levelsImportance = [
    { value: 9, label: "Highest" },
    { value: 8, label: "Very high" },
    { value: 7, label: "High" },
    { value: 6, label: "Medium-high" },
    { value: 5, label: "Medium" },
    { value: 4, label: "Medium-low" },
    { value: 3, label: "Low" },
    { value: 2, label: "Very low" },
    { value: 1, label: "Lowest" },
  ];

  // Fetch children of the current parent
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/api/projects/${projectId}`);
        const treeData = response.data;

        // Find the current parent in the tree and get its children
        const findNodeById = (node, id) => {
          if (node.id?.toString() === id.toString()) return node;
          if (!node.children || node.children.length === 0) return null;
          for (let child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
          }
          return null;
        };

        const parentNode = findNodeById(treeData, currentParent.id);
        if (parentNode && parentNode.children) {
          setChildren(parentNode.children);

          // Initialize importance values with existing values or empty strings
          const initialImportance = {};
          parentNode.children.forEach((child) => {
            initialImportance[child.id] = child.attributes?.importance || "";
          });
          setChildrenImportance(initialImportance);
        } else {
          setChildren([]);
        }
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to fetch children. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (currentParent && projectId) {
      fetchChildren();
    }
  }, [currentParent, projectId]);

  const handleImportanceChange = (childId, importance) => {
    setChildrenImportance((prev) => ({
      ...prev,
      [childId]: importance,
    }));
  };

  const handleSave = async () => {
    // Check if all children have importance assigned
    const allChildrenHaveImportance = children.every(
      (child) =>
        childrenImportance[child.id] && childrenImportance[child.id] !== ""
    );

    if (!allChildrenHaveImportance) {
      setError(
        "Please assign importance levels to all children before continuing."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Save importance for each child
      for (const child of children) {
        const importance = parseInt(childrenImportance[child.id], 10);
        await axiosInstance.put(
          `/api/projects/${projectId}/nodes/${child.id}`,
          {
            attributes: {
              ...child.attributes,
              importance: importance,
            },
          }
        );
      }

      // Call onComplete to proceed to next step
      onComplete();
    } catch (err) {
      console.error("Failed to save children importance:", err);
      setError("Failed to save importance levels. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="p-3 bg-white rounded-lg shadow-md mx-4">
        <div className="text-center text-xl">Loading children...</div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <div className="p-3 bg-white rounded-lg shadow-md mx-4">
        <h2 className="text-2xl font-semibold mb-1">
          Relative Importance for: {}
          <span className="text-indigo-700">{currentParent.name}</span>
        </h2>
        <div className="text-center text-lg text-gray-600">
          This parent has no children to assign importance to.
        </div>
        <div className="flex justify-between mt-3">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-base"
            onClick={onBack}
          >
            Back
          </button>
          <div className="flex justify-end">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md min-w-[150px] text-xl font-bold"
              onClick={onComplete}
              style={{ fontSize: "1.5rem" }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 bg-white rounded-lg shadow-md mx-4">
      <h2 className="text-2xl font-semibold mb-1">
        Relative Importance for: {}
        <span className="text-indigo-700">{currentParent.name}</span>
      </h2>

      <p className="text-lg text-red-700 mb-2">
        Please assign importance levels to each listed component
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Component names
              </h3>
            </div>
            <div className="flex-1 max-w-xs">
              <h3 className="text-lg font-semibold text-gray-800">
                Relative importance level
              </h3>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {children.map((child, index) => (
            <div key={child.id} className="px-3 py-2 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-800 leading-tight">
                    {child.nodeNumber ||
                      `${currentParent.nodeNumber || "1"}${index + 1}`}{" "}
                    {child.name}
                  </h3>
                </div>
                <div className="flex-1 max-w-xs">
                  <select
                    value={childrenImportance[child.id] || ""}
                    onChange={(e) =>
                      handleImportanceChange(child.id, e.target.value)
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="">Select</option>
                    {levelsImportance.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.value} - {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-base">
          {error}
        </div>
      )}

      <div className="flex justify-between mt-3">
        <button
          onClick={onBack}
          className="text-base font-bold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed min-w-[150px] flex items-center justify-center"
          disabled={saving}
        >
          <span style={{ fontSize: "1.5rem" }}>Back</span>
        </button>
        <div className="flex justify-end">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md min-w-[150px] text-xl font-bold"
            onClick={handleSave}
            disabled={saving}
            style={{ fontSize: "1.5rem" }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelativeImportance;
