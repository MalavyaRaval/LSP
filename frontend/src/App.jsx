import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home.jsx";
import Intro from "./components/Intro.jsx";
import ProjectPage from "./components/ProjectPage.jsx";
import DisplayEvaluations from "./components/DisplayEvaluations";
import ProjectEvaluation from "./components/ProjectEvaluation.jsx";
import ModifyEvaluation from "./components/ModifyEvaluation.jsx";
import DemaChat from "./components/DemaChat.jsx";
import Login from "./components/register/Login.jsx";
import Signup from "./components/register/Signup.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/project/:projectname" element={<ProjectPage />} />
        <Route
          path="/project/:projectname/evaluate"
          element={<DisplayEvaluations />}
        />
        <Route
          path="/project/:projectname/evaluation/new"
          element={<ProjectEvaluation />}
        />
        <Route
          path="/project/:projectname/evaluation/:evaluationId/modify"
          element={<ModifyEvaluation />}
        />
        <Route path="/projects/:projectname/demachat" element={<DemaChat />} />
        <Route path="/" element={<Intro />} />
        <Route path="/register/login" element={<Login />} />
        <Route path="/register/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
};

export default App;
