import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import axiosInstance from "./utils/axiosInstance";
import { Folder, Trash2, BarChart3, ArrowRight } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({ name: "" });

  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventDetails({
      ...eventDetails,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!eventDetails.name.trim()) {
      return;
    }

    // Find a unique project name (case-insensitive)
    let baseName = eventDetails.name.trim();
    let uniqueName = baseName;
    let suffix = 1;
    const existingNamesLower = events.map((ev) => ev.name.toLowerCase());
    while (existingNamesLower.includes(uniqueName.toLowerCase())) {
      uniqueName = `${baseName}${suffix}`;
      suffix++;
    }

    try {
      const projectPayload = {
        projectName: uniqueName,
      };

      const projectResponse = await axiosInstance.post(
        "/api/projects",
        projectPayload
      );

      // Then set the event info via the new /api/projects/event endpoint.
      const eventPayload = {
        projectId: projectResponse.data.projectId,
        name: uniqueName,
      };
      const eventResponse = await axiosInstance.post(
        "/api/projects/event",
        eventPayload
      );

      setEvents([
        ...events,
        {
          ...eventResponse.data.event,
          projectId: projectResponse.data.projectId,
        },
      ]);

      setEventDetails({ name: "" });
      navigate(
        `/project/${uniqueName.trim().toLowerCase().replace(/\s+/g, "-")}`
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Project creation failed";
      alert(errorMessage);
    }
  };

  const handleDelete = async (projectId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this entire project? This will delete the project tree and all related data."
      )
    ) {
      try {
        const response = await axiosInstance.delete(
          `/api/projects/${projectId}`
        );
        if (response.data && !response.data.error) {
          getAllEvents();
        } else {
          alert("Failed to delete Project");
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          alert("You do not have permission to delete this Project");
        } else {
          alert("Error deleting Project: " + error.message);
        }
      }
    }
  };

  // Update getAllEvents to call the new endpoint that fetches event info from projects.
  const getAllEvents = async () => {
    try {
      const response = await axiosInstance.get("/api/projects/events");
      if (response.data && response.data.events) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error(
        "Error fetching Projects:",
        error.response || error.message || error
      );
      if (error.message === "timeout of 10000ms exceeded") {
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    getAllEvents();
    // Open modal if navigated from Intro.jsx with showCreate flag
    if (location.state && location.state.showCreate) {
      setShowModal(true);
      // Optionally clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <button
        type="button"
        className="fixed top-28 left-4 w-auto px-4 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-110 focus:outline-none z-10 flex items-center justify-center"
        onClick={() => setShowModal(true)}
        aria-label="Create New Project"
      >
        <span className="text-lg font-bold">Create New Project</span>
      </button>
      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Modal for creating a new project */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-filter backdrop-blur-xl">
            <div className="modal-dialog w-full max-w-2xl md:max-w-3xl lg:max-w-4xl">
              <div className="modal-content p-8 bg-white rounded-xl">
                <div className="modal-header flex justify-between items-center mb-0">
                  <h3 className="text-3xl font-bold text-gray-800">
                    Create New Project
                  </h3>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="mb-4">
                      <label className="block text-xl font-semibold text-gray-700 mb-2">
                        Please enter the type of object you want to evaluate
                        <span className="block text-base font-normal text-gray-500 mt-1">
                          (e.g., car, home, laptop, job, school, hotel, etc.)
                        </span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm transition-all"
                        value={eventDetails.name}
                        onChange={handleChange}
                        placeholder="Enter project name"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        type="button"
                        className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-lg font-medium shadow-sm transition-all"
                        onClick={() => setShowModal(false)}
                      >
                        Show existing projects
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-semibold shadow-md transition-all"
                      >
                        Create Project
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Existing Projects
          </h1>
          <p className="text-gray-600">Manage and evaluate existing projects</p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Project Header */}
              <div className="relative w-full h-48 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <Folder className="w-16 h-16 text-white mb-2 transform group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/30 to-transparent">
                  <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                    {event.name}
                  </h2>
                </div>
              </div>

              {/* Project Actions */}
              <div className="p-6">
                <div className="space-y-3">
                  {/* Open Project Button */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/project/${event.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-blue-300 text-black font-semibold rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md group/btn"
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      Open Project
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  {/* Show Results Button */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/project/${event.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}/evaluate`
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-300 text-black-900 font-semibold rounded-xl hover:bg-gray-500 transition-all duration-200"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Show Results
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(event.projectId)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-600 font-semibold rounded-xl hover:bg-red-300 transition-all duration-200 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
