import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import HelpModal from "../HelpModal";

const Navbar = () => {
  const [currentPage, setCurrentPage] = useState("Home");
  const [projectDisplayName, setProjectDisplayName] = useState("");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectname } = useParams();
  // Determine current page based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/home")) {
      setCurrentPage("Existing Projects");
    } else if (path.includes("/project")) {
      if (path.includes("/evaluate")) {
        setCurrentPage("Evaluation Results");
      } else {
        // When on queries page, we'll display the project name in the center
        if (projectname) {
          setCurrentPage(""); // Clear current page name so only project name shows
        } else {
          setCurrentPage("Queries");
        }
      }
    } else if (path === "/") {
      setCurrentPage("V-1.0 (Single User)");
    }
  }, [location, projectname]);
  useEffect(() => {
    if (projectname) {
      axiosInstance
        .get(`/api/projects/${projectname}`)
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
  }, [projectname]);

  const toggleHelpModal = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  return (
    <div className="navbar-container relative">
      <nav className="w-full h-24 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 grid grid-cols-3 items-start px-6 shadow-lg mb-2 relative z-20">
        {/* Left section with LSPrec title */}
        <div className="flex items-center">
          <h1 className="text-white font-extrabold !text-5xl mt-3">LSPrec</h1>
        </div>
        {/* Center section with Current Page Title or Project Name */}
        <div className="text-center flex flex-col justify-start h-full pt-0 mt-0 absolute left-1/2 transform -translate-x-1/2 top-0">
          {currentPage && (
            <h2 className="text-white font-bold !text-5xl whitespace-nowrap pt-3 mt-0">
              {currentPage}
            </h2>
          )}
          {projectDisplayName && !currentPage && (
            <h2 className="text-white font-bold !text-5xl whitespace-nowrap pt-0 mt-0">
              {projectDisplayName}
            </h2>
          )}
        </div>
        {/* Right section with Help button only */}

        <div className="flex justify-end items-center relative">
          <button
            onClick={toggleHelpModal}
            className="text-white font-semibold text-2xl bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg shadow-md transition-all duration-300 !-mt-16 relative z-30 transform scale-110 origin-center"
            aria-label="Help"
            style={{ pointerEvents: "auto", fontSize: "1.5rem", lineHeight: 1 }}
          >
            Help
          </button>
        </div>
      </nav>

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        currentPage={
          currentPage || (projectDisplayName ? projectDisplayName : "General")
        }
      />
    </div>
  );
};
export default Navbar;
