import React from "react";
import malavyaRavalImage from "../images/malavya-raval.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faGithub } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import Navbar from "./Nav/Navbar";

const AboutUs = () => {
  return (
    <div className="bg-gray-400 min-h-screen">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">
          About Us
        </h1>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
          <div className="flex flex-col items-center bg-white rounded-lg shadow-xl p-6 max-w-sm lg:max-w-md w-full">
            <img
              src={malavyaRavalImage}
              alt="Malavya Raval"
              className="w-48 h-48 rounded-full object-cover border-4 border-blue-500 mb-6"
            />
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Malavya Raval
            </h2>
            <p className="text-lg text-gray-600 mb-6 text-center">
              Malavya Raval specializes in front-end development, bringing
              designs to life with clean, responsive, and intuitive interfaces.
              Malavya's dedication to user experience ensures that every project
              is both visually appealing and highly functional.
            </p>
            <div className="flex gap-6">
              <a
                href="https://www.linkedin.com/in/malavya-raval/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <FontAwesomeIcon icon={faLinkedin} size="2x" />
              </a>
              <a
                href="https://github.com/malavyaraval"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-800 hover:text-black"
              >
                <FontAwesomeIcon icon={faGithub} size="2x" />
              </a>
              <a
                href="mailto:malavyaraval@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800"
              >
                <FontAwesomeIcon icon={faEnvelope} size="2x" />
              </a>
            </div>
          </div>
          {/* Additional Info Section (if needed) */}
          {/* You can add more information here, like projects, skills, etc. */}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
