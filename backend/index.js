require("dotenv").config();
const path = require("path");
const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");

// Connect to MongoDB
mongoose.connect(config.connectionString || process.env.MONGODB_URI, {});

// Import models
const User = require("./models/user.model");
const Event = require("./models/event.model");
const Project = require("./models/Project");
const queryResultsRouter = require("./routes/queryResults");
const evaluationsRouter = require("./routes/evaluations");



// Import your authentication utility
const { authenticationToken } = require("./utilities");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use('/uploads', express.static('uploads'));
app.use("/api/query-results", queryResultsRouter);
app.use("/api/evaluations", evaluationsRouter);

app.use("/api/queryResults", require("./routes/queryResults"));
app.use("/api/evaluations", require("./routes/evaluations"));


// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error("Only image files are allowed"), false);
    }
  }
}).single("image");

// Example authentication middleware (adjust as needed)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  } else {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }
};

// Routes

const projectsRouter = require("./routes/projects");
app.use('/api/projects', projectsRouter);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

// Create new Account
app.post("/create-account", async (req, res) => {
  const { fullName, email, password, address, city, state, zip } = req.body;
  if (!fullName || !email || !password || !address || !city || !state || !zip) {
    return res.status(400).json({ error: true, message: "All fields are required" });
  }
  const isUser = await User.findOne({ email });
  if (isUser) {
    return res.status(400).json({ error: true, message: "User already exists" });
  }
  const user = new User({
    fullName,
    email,
    password, // Plain text storage
    address,
    city,
    state,
    zip
  });
  await user.save();
  const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3000m" });
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Registration Successful!"
  });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && user.password === password) {
    const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "6000m" });
    return res.json({
      accessToken,
      fullName: user.fullName
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
        createdOn: user.createdOn
      },
      message: ""
    });
  } catch (error) {
    return res.sendStatus(500);
  }
});

// Add Event (using default image if none provided)
app.post("/add-event", authenticationToken, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        error: true,
        message: err.message,
      });
    }
    const { name, description, projectId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "/uploads/default.jpg";
    const userId = req.user.userId;
    try {
      const event = new Event({
        name,
        description,
        image,
        projectId,
        createdBy: userId,
      });
      await event.save();
      return res.json({
        error: false,
        event,
        message: "Event added successfully",
      });
    } catch (error) {
      console.error("Error adding Event:", error);
      return res.status(500).json({
        error: true,
        message: "Internal Server Error",
      });
    }
  });
});

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
app.get("/get-all-events", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    return res.json({
      error: false,
      events,
      message: "All events retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

// Delete Event
app.delete("/delete-event/:eventId", authenticationToken, async (req, res) => {
  const eventId = req.params.eventId;
  try {
    const event = await Event.findOne({ _id: eventId });
    if (!event) {
      return res.status(404).json({ error: true, message: "Project not found" });
    }
    if (event.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        error: true,
        message: "You do not have permission to delete this Project"
      });
    }
    await Event.deleteOne({ _id: eventId });
    return res.json({
      error: false,
      message: "Project deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
