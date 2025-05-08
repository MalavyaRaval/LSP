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
        LSPrec is a decision-making tool that everybody can easily use without
        any preparation. LSPrec is built on the Logic Scoring of Preference
        (LSP) decision method, used by professionals for making complex
        decisions based on multiple criteria and graded logic. Based in simple
        queries, LSPrec is designed for nonprofessional users, making it easy to
        use while still maintaining its accuracy.
      </p>
    ),
  };

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-gray-50 to-blue-50 text-gray-800 min-h-screen flex flex-col items-center justify-center">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="mb-12 backdrop-blur-sm bg-white/30 p-8 rounded-2xl shadow-xl">
            <h1 className="text-6xl font-bold">Welcome to LSPrec</h1>
            <p className="text-4xl text-gray-800 mb-12">
              Decision making and recommendation aid for everybody.
            </p>

            {/* Information button */}
            <div className="mb-12">
              <button
                className="bg-white hover:bg-blue-50 transition-all duration-300 text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 w-full md:w-auto"
                onClick={() =>
                  handleShowInfo(aboutContent.what, "What is LSPrec?")
                }
                style={{ fontSize: "2rem" }}
              >
                What is LSPrec?
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col md:flex-row justify-center gap-8 mt-8">
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full md:w-auto"
                onClick={handleStartClick}
                style={{ fontSize: "2rem" }}
              >
                Start
              </button>

              <button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full md:w-auto"
                onClick={handleRegisterClick}
                style={{ fontSize: "2rem" }}
              >
                Register
              </button>
            </div>
          </div>
        </div>

        {/* Modal for displaying information */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-blue-600">
                  {modalTitle}
                </h2>
              </div>
              <div className="mb-6">{modalContent}</div>
              <div className="flex justify-end">
                <button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-6 rounded transition-all duration-300"
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
