import React, { useState, useEffect } from "react";
import symbol from "../images/symbol.jpg";
import Navbar from "./Nav/Navbar";
import Footer from "./Footer";

const Intro = () => {
  const [easterEgg, setEasterEgg] = useState(false);

  const handleImageClick = () => {
    setEasterEgg(true);
  };

  useEffect(() => {
    if (easterEgg) {
      const timer = setTimeout(() => {
        setEasterEgg(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [easterEgg]);

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 text-gray-800 min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Welcome to LSP Rec
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Welcome to LSP Rec, a simple and powerful decision-making tool
              designed for nonprofessional users.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-blue-600 mb-6">
              What is LSP Rec?
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              LSP Rec is built on the Logic Scoring of Preference (LSP) method,
              a powerful technique used for making complex decisions based on
              multiple criteria and graded logic. Unlike traditional systems,
              LSP Rec is designed for nonprofessional users, making it easy to
              use while still maintaining its accuracy.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-semibold text-blue-600 mb-6">
              Why LSP Rec?
            </h2>
            <ul className="space-y-4 text-lg text-gray-700">
              <li>
                <strong className="text-blue-600">
                  Simplified Decision Making:
                </strong>{" "}
                LSP Rec simplifies complex decision-making by reducing the
                number of criteria you need to consider.
              </li>
              <li>
                <strong className="text-blue-600">
                  No Technical Knowledge Required:
                </strong>{" "}
                Users don’t need to understand the underlying logic, just using
                the users preferences, and LSP Rec uses the graded logic to get
                the results for the user.
              </li>
              <li>
                <strong className="text-blue-600">
                  Personalized Recommendations:
                </strong>{" "}
                This tool can be used for decision-making ranging from choosing
                a hotel, house, or car. LSP Rec helps to get the best choice
                based on users' criteria.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-semibold text-blue-600 mb-6">
              Features of LSP Rec
            </h2>
            <ul className="space-y-4 text-lg text-gray-700">
              <li>
                <strong className="text-blue-600">
                  User-Friendly Interface:
                </strong>{" "}
                Easily enter your preferences using intuitive values.
              </li>
              <li>
                <strong className="text-blue-600">Accurate Results:</strong> LSP
                Rec uses the same proven methodology as the full LSP method to
                ensure high-quality recommendations.
              </li>
            </ul>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Intro;
