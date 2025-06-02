import React from "react";

const HelpModal = ({ isOpen, onClose, currentPage }) => {
  // Help content for different pages
  const helpContent = {
    Home: "This is the Home page help content. Here you can see a list of your projects and create new ones. The 'Create Project' button allows you to start a new project. You can click on any existing project to access its queries and evaluations.",

    Introduction:
      "Welcome to the Introduction page help. This page gives you an overview of the LSPrec system. Navigate through the sections to learn about the features and how to use the system effectively.",

    // Default help content for any other pages
    default:
      "This help section provides information about the current page. Navigate through different sections of the application using the menu. If you need more specific assistance, please contact support.",
  };

  // Get appropriate help text based on current page or project name
  const getHelpText = () => {
    if (currentPage && helpContent[currentPage]) {
      return helpContent[currentPage];
    }
    return helpContent.default;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Help: {currentPage || "General"}
          </h2>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-700">{getHelpText()}</p>
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
