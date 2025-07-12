import React from "react";

const HelpModal = ({ isOpen, onClose, currentPage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-7xl w-full mx-4 shadow-2xl h-5/6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Help Documentation: {currentPage || "General"}
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <iframe
            src="/LSPrecHELP.pdf"
            className="w-full h-full border-0"
            title="Help Documentation"
            style={{ minHeight: "600px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
