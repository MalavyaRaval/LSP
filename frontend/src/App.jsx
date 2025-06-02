import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home.jsx";
import Intro from "./components/Intro.jsx";
import ProjectPage from "./components/ProjectPage.jsx";
import DisplayEvaluations from "./components/DisplayEvaluations";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/project/:projectname" element={<ProjectPage />} />
        <Route path="/project/:projectname/evaluate" element={<DisplayEvaluations />} />
        <Route path="/" element={<Intro />} />
      </Routes>
    </Router>
  );
};

export default App;
