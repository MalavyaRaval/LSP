import axiosInstance from "./utils/axiosInstance";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import Footer from "./Footer";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    setError("");

    // Login API call
    try {
      const response = await axiosInstance.post("/login", {
        email: email,
        password: password,
      });

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);

        // Ensure fullName is available in the response data
        if (response.data.fullName) {
          localStorage.setItem("fullName", response.data.fullName);
        } else {
          console.error("Full name not found in the response data.");
        }

        navigate("/home"); // Redirect to home or another page after successful login
      } else {
        setError("Invalid response from server");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred");
      }
      console.error("Login error:", error); // Debugging line
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">
            Login
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="inputEmail"
                className="block text-lg font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="inputEmail"
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="inputPassword"
                className="block text-lg font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="inputPassword"
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300"
              >
                Login
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-4">
              Not registered yet?{" "}
              <Link
                to="/signup"
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                Create an Account
              </Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
