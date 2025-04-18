import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Dema = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const projectId = query.get("projectId");
  const parentId = query.get("parentId");
  const username = query.get("username");
  const projectname = query.get("projectname");

  // Decision-making states
  const [step, setStep] = useState("intro");
  const [objectName, setObjectName] = useState("");
  const [componentCount, setComponentCount] = useState("");
  const [componentDetails, setComponentDetails] = useState([]);

  const introMessage =
    "I am LSP Rec, your decision-making assistant. I can help you systematically evaluate alternatives and create structured project components.";
  const exitMessage =
    "Your components have been created successfully! Redirecting back to project...";

  useEffect(() => {
    if (step === "exit") {
      const timer = setTimeout(() => {
        navigate(`/user/${username}/project/${projectname}`);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, navigate, username, projectname]);

  const handleComponentCountSubmit = () => {
    const count = parseInt(componentCount);
    if (isNaN(count) || (count !== 0 && (count < 2 || count > 5))) {
      alert("Please enter 0 or a number between 2 and 5.");
      return;
    }
    if (count === 0) {
      setStep("summary");
    } else {
      setComponentDetails(
        Array.from({ length: count }, () => ({
          name: "",
          importance: "",
          connection: "",
        }))
      );
      setStep("componentDetails");
    }
  };

  const handleComponentDetailChange = (index, field, value) => {
    const newDetails = [...componentDetails];
    newDetails[index][field] = value;
    setComponentDetails(newDetails);
  };

  const handleComponentDetailsSubmit = () => {
    for (let i = 0; i < componentDetails.length; i++) {
      const { name, importance, connection } = componentDetails[i];
      if (!name.trim() || !importance || !connection) {
        alert(`Please fill all fields for component ${i + 1}`);
        return;
      }
      if (
        importance < 1 ||
        importance > 5 ||
        connection < 1 ||
        connection > 5
      ) {
        alert(`Component ${i + 1}: Values must be between 1-5`);
        return;
      }
    }
    setStep("summary");
  };

  const handleCreateChildren = async () => {
    try {
      const children = componentDetails.map((detail, index) => ({
        id: Date.now() + index,
        name: detail.name,
        attributes: {
          importance: parseInt(detail.importance),
          connection: parseInt(detail.connection),
        },
        children: [],
        parent: parseInt(parentId),
      }));

      await axios.post(
        `http://localhost:8000/api/projects/${projectId}/nodes`,
        {
          parentId: parseInt(parentId),
          children: children,
        }
      );
      setStep("exit");
    } catch (error) {
      alert("Failed to create children nodes");
      console.error("Error details:", error.response?.data);
    }
  };

  const renderDecisionStep = () => {
    switch (step) {
      case "intro":
        return (
          <div className="p-4 bg-white rounded-lg m-4 shadow-md">
            <p className="text-gray-700 mb-4">{introMessage}</p>
            <div className="flex gap-2">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => setStep("componentCount")}
              >
                Start Evaluation
              </button>
            </div>
          </div>
        );

      case "componentCount":
        return (
          <div className="p-4 bg-white rounded-lg m-4 shadow-md">
            <input
              type="number"
              min="1"
              max="5"
              value={componentCount}
              onChange={(e) => setComponentCount(e.target.value)}
              placeholder="Number of components (0, 2-5)"
              className="border p-2 rounded-lg w-full mb-2"
            />
            <button
              className="yexy-xl bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleComponentCountSubmit}
            >
              Continue
            </button>
          </div>
        );

      case "componentDetails":
        return (
          <div className="p-4 bg-white rounded-lg m-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Component Details</h3>
            {componentDetails.map((comp, index) => (
              <div key={index} className="mb-4">
                <input
                  type="text"
                  placeholder="Component name"
                  value={comp.name}
                  onChange={(e) =>
                    handleComponentDetailChange(index, "name", e.target.value)
                  }
                  className="border p-2 rounded-lg w-full mb-2"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Importance (1-5)"
                    value={comp.importance}
                    onChange={(e) =>
                      handleComponentDetailChange(
                        index,
                        "importance",
                        e.target.value
                      )
                    }
                    className="border p-2 rounded-lg w-1/2"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Connection (1-5)"
                    value={comp.connection}
                    onChange={(e) =>
                      handleComponentDetailChange(
                        index,
                        "connection",
                        e.target.value
                      )
                    }
                    className="border p-2 rounded-lg w-1/2"
                  />
                </div>
              </div>
            ))}
            <button
              className="text-xl bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              onClick={handleComponentDetailsSubmit}
            >
              Continue
            </button>
          </div>
        );

      case "summary":
        return (
          <div className="p-4 bg-white rounded-lg m-4 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <p className="mb-2">
              <strong>Object:</strong> {objectName}
            </p>
            <div className="mb-4">
              {componentDetails.map((comp, i) => (
                <div key={i} className="mb-2">
                  {comp.name} - Importance: {comp.importance}, Connection:{" "}
                  {comp.connection}
                </div>
              ))}
            </div>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={handleCreateChildren}
            >
              Create Components
            </button>
          </div>
        );

      case "exit":
        return (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg m-4">
            {exitMessage}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
          D
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Decision Assistant
        </h3>
      </div>

      {renderDecisionStep()}
    </div>
  );
};

export default Dema;
