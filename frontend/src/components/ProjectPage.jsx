import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "./utils/axiosInstance";
import Navbar from "./Nav/Navbar";
import ProjectTree from "./ProjectTree";
import DemaChat from "./DemaChat.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Resizable } from "re-resizable";

const ProjectPage = () => {
  const { projectname } = useParams();
  const navigate = useNavigate();

  // Convert projectname to a slug for use as projectId.
  const projectSlug = projectname;
  const evaluatorName = "testing";

  // State for project display name (from the project tree root's "name")
  const [projectDisplayName, setProjectDisplayName] = useState("");
  // State for scale (for zoom/drag features)
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState("chat"); // Track active tab: "chat" or "tree"

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
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold"
              onClick={() => handleNav("evaluate")}
            >
              View Results
            </button>
            <button
              className={`px-3 py-1 border border-gray-300 rounded bg-gray-200 hover:bg-gray-300 text-2xl font-bold ${
                activeTab === "tree"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700"
              }`}
              onClick={() => setActiveTab("tree")}
            >
              Project Tree
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
      <main className="flex-grow pt-0.5 px-4 pb-4 max-w-6xl mx-auto w-full text-lg">
        {activeTab === "chat" && (
          <div className="border border-gray-200 rounded bg-white text-lg">
            <DemaChat />
          </div>
        )}

        {activeTab === "tree" && (
          <Resizable
            defaultSize={{
              width: "100%",
              height: 700,
            }}
            minWidth={300}
            minHeight={400}
            enable={{
              top: false,
              right: false,
              bottom: true,
              left: false,
              topRight: false,
              bottomRight: true,
              bottomLeft: true,
              topLeft: false,
            }}
          >
            <div
              className="relative border border-gray-200 rounded bg-white overflow-hidden text-lg"
              style={{
                width: "100%",
                height: "100%",
                backgroundImage:
                  "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <TransformWrapper
                initialScale={scale}
                centerOnInit={true}
                wheel={{ step: 0.2 }}
                doubleClick={{ disabled: true }}
                limitToBounds={false}
                preservePosition={true}
                minScale={0.25}
                maxScale={1}
                onScaleChange={({ scale }) => setScale(scale)}
              >
                {({ resetTransform }) => (
                  <>
                    <TransformComponent
                      wrapperStyle={{ width: "100%", height: "100%" }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <ProjectTree
                          projectId={projectSlug}
                          username={evaluatorName}
                          projectname={projectname}
                        />
                      </div>
                    </TransformComponent>
                    <button
                      className="absolute bottom-4 right-4 px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-100"
                      onClick={() => resetTransform()}
                    >
                      Reset View
                    </button>
                  </>
                )}
              </TransformWrapper>
            </div>
          </Resizable>
        )}
      </main>
    </div>
  );
};

export default ProjectPage;
