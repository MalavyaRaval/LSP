import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Nav/Navbar";

// Import images
import image1 from "./Nav/image1.png";
import image2 from "./Nav/image2.png";
import image3 from "./Nav/image3.png";

const images = [image1, image2, image3];

const Intro = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [imageStep, setImageStep] = useState(0);
  const [showUserChoiceModal, setShowUserChoiceModal] = useState(false);
  const [userChoiceModalContent, setUserChoiceModalContent] = useState("");
  const [userChoiceModalTitle, setUserChoiceModalTitle] = useState("");
  const [userChoiceModalHelp, setUserChoiceModalHelp] = useState("");

  const handleShowInfo = (content, title) => {
    setModalContent(content);
    setModalTitle(title);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Modified Start click handler
  const handleStartClick = () => {
    setImageStep(0);
    setShowModal(true);
  };

  // Handle continue through images
  const handleContinue = () => {
    if (imageStep < images.length - 1) {
      setImageStep((prev) => prev + 1);
    } else {
      // All images displayed, now show the user choice modal
      setShowModal(false);
      setShowUserChoiceModal(true);
      setUserChoiceModalTitle("Choose Your Status");
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-gray-50 to-blue-50 text-gray-800 min-h-screen flex flex-col items-center justify-center">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <div className="mb-12 backdrop-blur-sm bg-white/30 p-8 rounded-2xl shadow-xl">
            <h1 className="text-6xl font-bold">Welcome to LSPrec</h1>
            <p className="text-4xl text-gray-800 mb-12">
              Decision making and recommendation aid for everybody
            </p>
            {/* Center Start button */}
            <div className="flex justify-center mt-8">
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                onClick={handleStartClick}
                style={{ fontSize: "2rem" }}
              >
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Modal for displaying images in sequence */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-2 max-h-[98vh] flex flex-col items-center">
              <img
                src={images[imageStep]}
                alt={`Step ${imageStep + 1}`}
                className="w-full object-contain flex-1"
              />
              <div className="flex justify-end w-full flex-shrink-0">
                <button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2 px-6 rounded transition-all duration-300"
                  onClick={handleContinue}
                >
                  <b>
                    {imageStep < images.length - 1 ? "Continue" : "Continue"}
                  </b>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for user choice (Single Time User vs Registered User) */}
        {showUserChoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                {userChoiceModalTitle}
              </h2>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <button
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-lg shadow-md transition-all duration-300"
                    onClick={() =>
                      navigate("/home", { state: { showCreate: true } })
                    }
                  >
                    Single Time User
                  </button>
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-full text-md ml-4"
                    onClick={() => {
                      alert(
                        "As a single time user, you can use the application without logging in. Your data will not be saved."
                      );
                    }}
                  >
                    ?
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-lg shadow-md transition-all duration-300"
                    onClick={() => navigate("/register/login")}
                  >
                    Registered User
                  </button>
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-full text-md ml-4"
                    onClick={() => {
                      alert(
                        "As a registered user, you can create an account, log in, and save your progress and data for future use."
                      );
                    }}
                  >
                    ?
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Intro;
