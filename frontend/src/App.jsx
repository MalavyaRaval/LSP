import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import SignUp from "./components/SignUp.jsx";
import Login from "./components/Login.jsx";
import Home from "./components/Home.jsx";
import AboutUs from "./components/aboutus.jsx";
import Intro from "./components/Intro.jsx";
import MyProfile from "./components/MyProfile.jsx";
import ProjectPage from "./components/ProjectPage.jsx";
import ProjectTree from "./components/ProjectTree.jsx";
import Projectvalidation from "./components/ProjectValidation.jsx";
import DemaChat from "./components/DemaChat";
import Query4 from "./components/Query/Query4.jsx";
import Query5 from "./components/Query/Query5.jsx";
import Query6 from "./components/Query/Query6.jsx";
import QueryResultsDisplay from "./components/QueryResultsDisplay";
import DisplayEvaluations from "./components/DisplayEvaluations";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/myprofile" element={<MyProfile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/project/:projectId" element={<ProjectTree />} />
        <Route path="/" element={<Intro />} />
        <Route
          path="/user/:username/project/:projectname"
          element={<ProjectPage />}
        />
        <Route
          path="/user/:username/project/:projectname/validation"
          element={<Projectvalidation />}
        />
        <Route
          path="/user/:username/project/:projectname/dema-chat"
          element={<DemaChat />}
        />{" "}
        <Route path="/q4" element={<Query4 />} />
        <Route path="/q5" element={<Query5 />} />
        <Route path="/q6" element={<Query6 />} />
        <Route
          path="/user/:username/project/:projectname/Queryresults"
          element={<QueryResultsDisplay />}
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
