require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

// Connect MongoDB 
mongoose.connect(config.connectionString || process.env.MONGODB_URI, {});

// Import models
const queryResultsRouter = require("./routes/queryResults");
const evaluationsRouter = require("./routes/evaluations");
const authRouter = require("./routes/auth"); // Import auth routes
const { verifyTransporter } = require('./utils/mailer');

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use("/api/query-results", queryResultsRouter);
app.use("/api/evaluations", evaluationsRouter);
app.use("/api/auth", authRouter); // Use auth routes

app.use("/api/queryResults", require("./routes/queryResults"));
app.use("/api/evaluations", require("./routes/evaluations"));

// Routes

const projectsRouter = require("./routes/projects");
app.use("/api/projects", projectsRouter);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Verify SMTP transporter configuration
  try {
    const ok = await verifyTransporter();
    if (!ok) {
      console.warn('SMTP transporter verification failed — emails may not be sent. Check SMTP_* env variables.');
    }
  } catch (err) {
    console.warn('Error while verifying SMTP transporter:', err.message || err);
  }
});
