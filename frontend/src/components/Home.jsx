import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Nav/Navbar";
import axiosInstance from "./utils/axiosInstance";
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
      alert("Error fetching Projects: " + error.message);
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
    <div className="flex flex-col min-h-screen bg-gray-200">
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
                        Cancel
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
        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                <h2 className="text-2xl font-bold text-gray-700">
                  {event.name}
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() =>
                      navigate(
                        `/project/${event.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}/evaluate`
                      )
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(event.projectId)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/project/${event.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      )
                    }
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Open Project
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
