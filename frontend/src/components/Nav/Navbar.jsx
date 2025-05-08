import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import HelpModal from "../HelpModal";

const Navbar = () => {
  const [burger_class, setBurgerClass] = useState("burger-bar unclicked");
  const [menu_class, setMenuClass] = useState("menu hidden");
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");
  const [projectDisplayName, setProjectDisplayName] = useState("");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { projectname } = useParams();
  const menuRef = useRef(null);
  const burgerRef = useRef(null);

  // Determine current page based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/home")) {
      setCurrentPage("Home");
    } else if (path.includes("/login")) {
      setCurrentPage("Login");
    } else if (path.includes("/signup")) {
      setCurrentPage("Sign Up");
    } else if (path.includes("/aboutus")) {
      setCurrentPage("About Us");
    } else if (path.includes("/myprofile")) {
      setCurrentPage("My Profile");
    } else if (path.includes("/project")) {
      if (path.includes("/validation")) {
        setCurrentPage("Project Validation");
      } else if (path.includes("/evaluate")) {
        setCurrentPage("Project Evaluation");
      } else if (path.includes("/Queryresults")) {
        setCurrentPage("Query Results");
      } else {
        // When on queries page, we'll display the project name in the center
        if (projectname) {
          setCurrentPage(""); // Clear current page name so only project name shows
        } else {
          setCurrentPage("Queries");
        }
      }
    } else if (path === "/") {
      setCurrentPage("Introduction");
    }
  }, [location, projectname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuClicked &&
        !menuRef.current?.contains(event.target) &&
        !burgerRef.current?.contains(event.target)
      ) {
        updateMenu();
      }
    };

    if (isMenuClicked) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuClicked]);

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

  const updateMenu = () => {
    if (!isMenuClicked) {
      setBurgerClass("burger-bar clicked");
      setMenuClass("menu visible");
    } else {
      setBurgerClass("burger-bar unclicked");
      setMenuClass("menu hidden");
    }
    setIsMenuClicked(!isMenuClicked);
  };

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const toggleHelpModal = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  return (
    <div className="navbar-container relative">
      <nav className="w-full h-20 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 grid grid-cols-3 items-center px-6 shadow-lg mb-2 relative z-20">
        {/* Left section with burger menu and LSPrec */}
        <div className="flex items-center">
          <div
            className="burger-menu w-12 h-20 flex flex-col justify-center items-center cursor-pointer mr-4"
            onClick={updateMenu}
            ref={burgerRef}
          >
            <div
              className={`${burger_class} w-6 h-1 bg-white mb-1 transition-all duration-500 ease-in-out`}
            ></div>
            <div
              className={`${burger_class} w-6 h-1 bg-white mb-1 transition-all duration-500 ease-in-out`}
            ></div>
            <div
              className={`${burger_class} w-6 h-1 bg-white transition-all duration-500 ease-in-out`}
            ></div>
          </div>
          <h1 className="text-white font-extrabold !text-5xl">LSPrec</h1>
        </div>

        {/* Center section with Current Page Title or Project Name */}
        <div className="text-center">
          {currentPage && (
            <h2 className="text-white font-bold !text-5xl whitespace-nowrap !-mt-16">
              {currentPage}
            </h2>
          )}
          {projectDisplayName && !currentPage && (
            <h2 className="text-white font-bold !text-5xl whitespace-nowrap !-mt-16">
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

      {/* Mobile Menu - Slide In from the left */}
      <div
        className={`${menu_class} fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-gray-100 via-white to-gray-100 shadow-lg backdrop-blur-md transform transition-all duration-500 ease-in-out z-50`}
        ref={menuRef}
      >
        <ul className="list-none p-6 space-y-6 text-gray-900">
          <li>
            <a
              href="/home"
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/aboutus"
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              About Us
            </a>
          </li>
        </ul>
      </div>

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
