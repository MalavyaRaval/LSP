import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./components/SignUp.jsx";
import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";
import Intro from "./components/Intro.jsx";
import ProjectPage from "./components/ProjectPage.jsx";
import ProjectTree from "./components/ProjectTree.jsx";
import DemaChat from "./components/DemaChat";
import DisplayEvaluations from "./components/DisplayEvaluations";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/project/:projectId" element={<ProjectTree />} />
        <Route path="/" element={<Intro />} />{" "}
        <Route
          path="/user/:username/project/:projectname"
          element={<ProjectPage />}
        />
        <Route
          path="/user/:username/project/:projectname/dema-chat"
          element={<DemaChat />}
        />
        <Route
          path="/user/:username/project/:projectname/evaluate"
          element={<DisplayEvaluations />}
        />
      </Routes>
    </Router>
  );
};

export default App;
