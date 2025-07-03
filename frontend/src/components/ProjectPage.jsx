import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";
import Navbar from "./Nav/Navbar";
import ProjectTree from "./ProjectTree";
import DemaChat from "./DemaChat.jsx";

const ProjectPage = () => {
  const { projectname } = useParams();
  const navigate = useNavigate();

  // State for project decomposition data
  const [processedNodes, setProcessedNodes] = useState(new Set());
  const [bfsQueue, setBfsQueue] = useState([]);
  const [currentParentId, setCurrentParentId] = useState(null);

  // Convert projectname to a slug for use as projectId.
  const projectSlug = projectname;
  const evaluatorName = "testing";

  // State for project display name (from the project tree root's "name")
  const [projectDisplayName, setProjectDisplayName] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (projectSlug) {
      axiosInstance
        .get(`/api/projects/${projectSlug}`)
        .then((res) => {
          if (res.data && res.data.name) {
            setProjectDisplayName(res.data.name);
          } else {
            setProjectDisplayName(projectname);
          }
        })
        .catch((err) => {
          console.error("Error loading project name:", err);
          setProjectDisplayName(projectname);
        });
    }
  }, [projectSlug, projectname]);
  const handleNav = (action) => {
    if (action === "projects") {
      navigate("/home");
    } else if (action === "evaluate") {
      navigate(`/project/${projectSlug}/evaluate`);
    } else if (action === "exit") {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      {/* Ultra-compact header with navigation buttons */}
      <header className="border-b border-gray-200 py-0.5 -mt-2">
        <div className="flex flex-wrap items-center justify-between px-3 gap-1">
          <div className="flex flex-wrap gap-1">
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => handleNav("projects")}
            >
              All Projects
            </button>
            {/* Project Evaluation Button */}
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => navigate(`/project/${projectSlug}/evaluation/new`)}
            >
              New Alternative
            </button>
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => handleNav("evaluate")}
            >
              View Results
            </button>
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => handleNav("exit")}
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Main content area - pushed closer to header */}
      <main className="flex-grow pt-0.5 px-4 pb-4 w-full flex flex-col">
        <div className="border border-gray-200 rounded bg-white text-lg">
          <DemaChat />
        </div>

        <div className="relative w-full mt-4">
          <div>
            <ProjectTree
              projectId={projectSlug}
              processedNodes={processedNodes}
              bfsQueue={bfsQueue}
              currentParentId={currentParentId}
              username={evaluatorName}
              projectname={projectname}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;
