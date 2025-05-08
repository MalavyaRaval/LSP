import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import symbol from "../images/symbol.jpg";
import Navbar from "./Nav/Navbar";
import Footer from "./Footer";
import axiosInstance from "../utils/axiosInstance";

const Intro = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const handleShowInfo = (content, title) => {
    setModalContent(content);
    setModalTitle(title);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleStartClick = async () => {
    try {
      const response = await axiosInstance.post("/login", {
        email: "test@mymail.com",
        password: "1",
      });

      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        if (response.data.fullName) {
          localStorage.setItem("fullName", response.data.fullName);
        }
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegisterClick = () => {
    navigate("/login");
  };

  // Information content for modals
  const aboutContent = {
    what: (
      <p className="text-lg text-gray-700 leading-relaxed">
        LSPrec is built on the Logic Scoring of Preference (LSP) method, a
        powerful technique used for making complex decisions based on multiple
        criteria and graded logic. Unlike traditional systems, LSPrec is
        designed for nonprofessional users, making it easy to use while still
        maintaining its accuracy.
      </p>
    ),
    why: (
      <ul className="space-y-4 text-lg text-gray-700">
        <li>
          <strong className="text-blue-600">Simplified Decision Making:</strong>{" "}
          LSPrec simplifies complex decision-making by reducing the number of
          criteria you need to consider.
        </li>
        <li>
          <strong className="text-blue-600">
            No Technical Knowledge Required:
          </strong>{" "}
          Users don't need to understand the underlying logic, just using the
          users preferences, and LSPrec uses the graded logic to get the results
          for the user.
        </li>
        <li>
          <strong className="text-blue-600">
            Personalized Recommendations:
          </strong>{" "}
          This tool can be used for decision-making ranging from choosing a
          hotel, house, or car. LSPrec helps to get the best choice based on
          users' criteria.
        </li>
      </ul>
    ),
    features: (
      <ul className="space-y-4 text-lg text-gray-700">
        <li>
          <strong className="text-blue-600">User-Friendly Interface:</strong>{" "}
          Easily enter your preferences using intuitive values.
        </li>
        <li>
          <strong className="text-blue-600">Accurate Results:</strong> LSPrec
          uses the same proven methodology as the full LSP method to ensure
          high-quality recommendations.
        </li>
      </ul>
    ),
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 text-gray-800 min-h-screen flex flex-col items-center justify-center">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-blue-600 mb-6">
              Welcome to LSPrec
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Decision making and recommendation Aid for everybody.
            </p>

            {/* Information buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <button
                className="bg-white hover:bg-blue-50 transition-colors text-blue-600 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg"
                onClick={() =>
                  handleShowInfo(aboutContent.what, "What is LSPrec?")
                }
              >
                What is LSPrec?
              </button>

              <button
                className="bg-white hover:bg-blue-50 transition-colors text-blue-600 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg"
                onClick={() => handleShowInfo(aboutContent.why, "Why LSPrec?")}
              >
                Why LSPrec?
              </button>

              <button
                className="bg-white hover:bg-blue-50 transition-colors text-blue-600 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg"
                onClick={() =>
                  handleShowInfo(aboutContent.features, "Features of LSPrec")
                }
              >
                Features
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row justify-center gap-6 mt-8">
              <button
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-xl font-bold py-4 px-12 rounded-lg shadow-lg hover:shadow-xl"
                onClick={handleStartClick}
              >
                Start
              </button>

              <button
                className="bg-green-600 hover:bg-green-700 transition-colors text-white text-xl font-bold py-4 px-12 rounded-lg shadow-lg hover:shadow-xl"
                onClick={handleRegisterClick}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Modal for displaying information */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-blue-600">
                  {modalTitle}
                </h2>
                <button
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              <div className="mb-6">{modalContent}</div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default Intro;
