require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Connect to MongoDB
mongoose.connect(config.connectionString || process.env.MONGODB_URI, {});

// Import models
const User = require("./models/user.model");
const queryResultsRouter = require("./routes/queryResults");
const evaluationsRouter = require("./routes/evaluations");

// Import your authentication utility
const { authenticationToken } = require("./utilities");

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/api/query-results", queryResultsRouter);
app.use("/api/evaluations", evaluationsRouter);

app.use("/api/queryResults", require("./routes/queryResults"));
app.use("/api/evaluations", require("./routes/evaluations"));

// Set up multer for file uploads

// Example authentication middleware (adjust as needed)

// Routes

const projectsRouter = require("./routes/projects");
app.use("/api/projects", projectsRouter);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// Create new Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password, address, city, state, zip } = req.body;
  if (!fullName || !email || !password || !address || !city || !state || !zip) {
    return res
      .status(400)
      .json({ error: true, message: "All fields are required" });
  }
  const isUser = await User.findOne({ email });
  if (isUser) {
    return res
      .status(400)
      .json({ error: true, message: "User already exists" });
  }
  const user = new User({
    fullName,
    email,
    password,
    address,
    city,
    state,
    zip,
  });
  await user.save();
  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "3000m" }
  );
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration Successful!",
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && user.password === password) {
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "6000m" }
    );
    return res.json({
      accessToken,
      fullName: user.fullName,
    });
  } else {
    return res.status(400).json({ message: "Invalid credentials" });
  }
});

// Get User
app.get("/get-user", authenticationToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.sendStatus(401);
    }
    return res.json({
      user: {
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        city: user.city,
        state: user.state,
        zip: user.zip,
        createdOn: user.createdOn,
      },
      message: "",
    });
  } catch (error) {
    return res.sendStatus(500);
  }
});

// Add Event

// Edit Account
app.put("/edit-account", authenticationToken, async (req, res) => {
  const userId = req.user.userId;
  const { fullName, email, password, address, city, state, zip } = req.body;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }
    if (user._id.toString() !== userId) {
      return res.status(403).json({ error: true, message: "Unauthorized" });
    }
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (password) user.password = password;
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;
    if (zip) user.zip = zip;
    await user.save();
    return res.json({
      error: false,
      user,
      message: "User information updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Get all Events

// Delete Event

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
