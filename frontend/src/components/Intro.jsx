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
      setShowModal(false);
      navigate("/home", { state: { showCreate: true } });
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
              Decision making and recommendation aid for everybody.
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
                  {imageStep < images.length - 1
                    ? "Continue"
                    : "Continue to App"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Intro;
