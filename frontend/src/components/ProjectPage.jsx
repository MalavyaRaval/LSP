import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import DemaChat from "./DemaChat.jsx";

const ProjectPage = () => {
  const { projectname } = useParams();
  const navigate = useNavigate();

  // Convert projectname to a slug for use as projectId.
  const projectSlug = projectname;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => navigate(`/project/${projectSlug}/evaluation/new`)}
            >
              New Competitor
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

      <main className="flex-grow pt-0.5 px-4 pb-4 w-full flex flex-col">
        <div className="border border-gray-200 rounded bg-white text-lg h-full">
          <DemaChat />
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;
