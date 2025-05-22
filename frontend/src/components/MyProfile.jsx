import React, { useState, useEffect } from "react";
import Navbar from "./Nav/Navbar";
import axiosInstance from "./utils/axiosInstance";

const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

const MyProfile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    profilePicture: "",
  });
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/get-user");
        if (response.data && response.data.user) {
          setUser(response.data.user);
          setPreview(response.data.user.profilePicture);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({
          ...user,
          profilePicture: reader.result,
        });
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUser({
      ...user,
      profilePicture: "",
    });
    setPreview("");
  };

  const handleSave = async () => {
    try {
      await axiosInstance.put("/edit-account", user);
      localStorage.setItem("user", JSON.stringify(user));
      setEditing(false);
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800">
          My Profile
        </h1>
        <div className="flex justify-center mt-6">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No Image
                  </div>
                )}
              </div>
            </div>

            {editing && (
              <div className="mt-4 flex justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="border border-gray-300 rounded p-2"
                />
                {preview && (
                  <button
                    onClick={handleRemoveImage}
                    className="ml-4 text-red-500 hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            )}

            <div className="mt-6">
              {editing ? (
                <div>
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block text-gray-700 font-medium"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block text-gray-700 font-medium"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="address"
                      className="block text-gray-700 font-medium"
                    >
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="city"
                      className="block text-gray-700 font-medium"
                    >
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="state"
                      className="block text-gray-700 font-medium"
                    >
                      State
                    </label>
                    <select
                      name="state"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.state}
                      onChange={handleChange}
                    >
                      <option>Choose...</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="zip"
                      className="block text-gray-700 font-medium"
                    >
                      Zip
                    </label>
                    <input
                      type="text"
                      name="zip"
                      className="w-full mt-2 p-2 border border-gray-300 rounded"
                      value={user.zip}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                      onClick={handleSave}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Address:</strong> {user.address}
                  </p>
                  <p>
                    <strong>City:</strong> {user.city}
                  </p>
                  <p>
                    <strong>State:</strong> {user.state}
                  </p>
                  <p>
                    <strong>Zip:</strong> {user.zip}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                      onClick={() => setEditing(true)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
