import React from "react";

const Footer = () => {
  return (
    <>
      <div className="content-wrap mb-4"></div>

      <footer className="w-full h-24 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-500 flex flex-col items-center justify-center px-6 shadow-lg text-white">
        <p className="text-lg md:text-xl text-center mb-3">
          {" "}
          &copy; {new Date().getFullYear()} Malavya Raval | mraval@sfsu.edu |
          LSP REC Project
        </p>
        <div className="flex space-x-6 justify-center">
          {" "}
          <a
            href="https://www.linkedin.com/in/malavyaraval/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 transition-all duration-300 text-lg"
          >
            LinkedIn
          </a>
          <a
            href="mailto:mraval@sfsu.edu"
            className="text-white hover:text-gray-200 transition-all duration-300 text-lg"
          >
            Email
          </a>
          <a
            href="https://github.com/MalavyaRaval"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-200 transition-all duration-300 text-lg"
          >
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
};
export default Footer;
