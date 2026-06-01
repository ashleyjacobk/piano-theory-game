const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Ensure uploads folder exists and serve it statically
const path = require("path");
const fs = require("fs");
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir));

// Import Routers
const authRouter = require("./routes/auth");
const studentsRouter = require("./routes/students");
const homeworkRouter = require("./routes/homework");
const practiceLogsRouter = require("./routes/practiceLogs");
const freePracticeRouter = require("./routes/freePractice");
const videosRouter = require("./routes/videos");
const notificationsRouter = require("./routes/notifications");
const profilesRouter = require("./routes/profiles");
const songsRouter = require("./routes/songs");

// Health Check
app.get("/", (req, res) => {
    res.send("Piano Theory SQLite API Server is active!");
});

// Mount Routers
app.use("/api", authRouter);
app.use("/api", profilesRouter);
app.use("/api/students", studentsRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/practice-logs", practiceLogsRouter);
app.use("/api/free-practice", freePracticeRouter);
app.use("/api/videos", videosRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/songs", songsRouter);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});