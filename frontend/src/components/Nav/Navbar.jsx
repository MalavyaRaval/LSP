import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [burger_class, setBurgerClass] = useState("burger-bar unclicked");
  const [menu_class, setMenuClass] = useState("menu hidden");
  const [isMenuClicked, setIsMenuClicked] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const burgerRef = useRef(null);

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
      <nav className="w-full h-20 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 flex items-center px-6 shadow-lg mb-4">
        {" "}
        {/* Added mb-4 for space below */}
        {/* Left Side - Burger Menu (Always visible) */}
        <div
          className="burger-menu w-16 h-16 flex flex-col justify-center items-center cursor-pointer absolute left-0"
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
        {/* Center - Website Name */}
        <h1 className="text-white text-xl font-extrabold absolute left-1/2 transform -translate-x-1/2">
          LSP Rec
        </h1>
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
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Home
            </a>
          </li>
          <li>
            <a
              href="/login"
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </a>
          </li>
          <li>
            <a
              href="/signup"
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign Up
            </a>
          </li>
          <li>
            <a
              href="/aboutus"
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              About Us
            </a>
          </li>
          <li>
            <a
              href="/myprofile"
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              My Profile
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={handleSignOut}
              className="block px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500"
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
