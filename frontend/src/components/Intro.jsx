import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Nav/Navbar";

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
  const handleStartClick = () => {
    navigate("/home");
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
      </div>
    </>
  );
};

export default Intro;
