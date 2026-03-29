const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const studyRoutes = require("./routes/studyRoutes");
const activityRoutes = require("./routes/activityRoutes");
const contextRoutes = require("./routes/contextRoutes");
const userRoutes = require("./routes/userRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS blocked for this origin."));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Upgrade Your Study backend is running"
  });
});

app.use("/api", authRoutes);
app.use("/api", studyRoutes);
app.use("/api", activityRoutes);
app.use("/api", contextRoutes);
app.use("/api", userRoutes);
app.use("/api", aiRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error"
  });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
