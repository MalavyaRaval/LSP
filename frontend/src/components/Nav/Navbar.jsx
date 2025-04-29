import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [burger_class, setBurgerClass] = useState("burger-bar unclicked");
  const [menu_class, setMenuClass] = useState("menu hidden");
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const [currentPage, setCurrentPage] = useState("Home");
  const navigate = useNavigate();
  const location = useLocation();
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
        setCurrentPage("Project Page");
      }
    } else if (path === "/") {
      setCurrentPage("Introduction");
    }
  }, [location]);

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

  return (
    <div className="navbar-container relative">
      <nav className="w-full h-20 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 flex items-center justify-between px-6 shadow-lg mb-4 relative">
        {/* Left section with burger menu and LSPrec */}
        <div className="flex items-center h-20">
          <div
            className="burger-menu w-12 h-12 flex flex-col justify-center items-center cursor-pointer mr-4"
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
          {/* LSPrec text on the left */}
          <h1 className="text-white font-extrabold !text-4xl">LSPrec</h1>
        </div>

        {/* Current Page Title in Center, moved up */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3">
          <h2 className="text-white font-bold !text-4xl whitespace-nowrap">
            {currentPage}
          </h2>
        </div>

        {/* Right empty space for balance */}
        <div className="w-32"></div>
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
              href="/login"
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              Login
            </a>
          </li>
          <li>
            <a
              href="/signup"
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              Sign Up
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
          <li>
            <a
              href="/myprofile"
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              My Profile
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={handleSignOut}
              className="block px-6 py-3 rounded-xl bg-gray-200 shadow hover:bg-blue-200 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 !text-2xl font-semibold"
            >
              Sign Out
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
export default Navbar;
