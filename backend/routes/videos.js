const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { dbQueryGet, dbQueryAll, dbRun } = require("../db/database");
const { getEmbedUrl } = require("../utils/youtube");

// Get Videos (filtered by student username or teacher code if provided)
router.get("/", async (req, res) => {
    const { username, teacherCode } = req.query;
    try {
        let rows;
        if (username) {
            rows = await dbQueryAll(
                `SELECT v.*, (SELECT COUNT(*) FROM video_comments WHERE videoId = v.id) AS commentsCount 
                 FROM videos v 
                 WHERE LOWER(v.studentUsername) = ?`,
                [username.toLowerCase()]
            );
        } else if (teacherCode && teacherCode.trim() !== "") {
            rows = await dbQueryAll(
                `SELECT v.*, (SELECT COUNT(*) FROM video_comments WHERE videoId = v.id) AS commentsCount 
                 FROM videos v 
                 JOIN users u ON LOWER(v.studentUsername) = LOWER(u.username) 
                 WHERE UPPER(u.teacherCode) = UPPER(?)`,
                [teacherCode.trim()]
            );
        } else {
            rows = [];
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Comments for a Video
router.get("/:videoId/comments", async (req, res) => {
    const { videoId } = req.params;
    try {
        const rows = await dbQueryAll(
            "SELECT * FROM video_comments WHERE videoId = ? ORDER BY id ASC",
            [parseInt(videoId)]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Comment to a Video
router.post("/:videoId/comments", async (req, res) => {
    const { videoId } = req.params;
    const { username, name, text } = req.body;
    if (!username || !name || !text) {
        return res.status(400).json({ error: "Missing required fields (username, name, text)" });
    }

    try {
        const user = await dbQueryGet("SELECT role FROM users WHERE LOWER(username) = ?", [username.toLowerCase()]);
        const role = user ? user.role : "student";

        const readByTeacher = role === "teacher" ? 1 : 0;
        const readByStudent = role === "student" ? 1 : 0;

        const createdAt = new Date().toISOString();
        const result = await dbRun(
            "INSERT INTO video_comments (videoId, username, name, text, createdAt, readByTeacher, readByStudent) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [parseInt(videoId), username, name, text.trim(), createdAt, readByTeacher, readByStudent]
        );

        res.json({
            id: result.id,
            videoId: parseInt(videoId),
            username,
            name,
            text: text.trim(),
            createdAt,
            readByTeacher,
            readByStudent
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark comments as read for a specific video and role
router.post("/:videoId/comments/read", async (req, res) => {
    const { videoId } = req.params;
    const { role } = req.body; // 'teacher' or 'student'
    if (!role) {
        return res.status(400).json({ error: "Missing role" });
    }
    try {
        if (role === "teacher") {
            await dbRun("UPDATE video_comments SET readByTeacher = 1 WHERE videoId = ?", [parseInt(videoId)]);
        } else if (role === "student") {
            await dbRun("UPDATE video_comments SET readByStudent = 1 WHERE videoId = ?", [parseInt(videoId)]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Video Lesson (Teacher, targeted to specific student)
router.post("/", async (req, res) => {
    const { songName, title, url, studentUsername, composer, fileData } = req.body;
    if (!songName || !title || (!url && !fileData) || !studentUsername) {
        return res.status(400).json({ error: "Missing required fields (songName, title, url or fileData, studentUsername)" });
    }

    try {
        let finalUrl = "";
        
        if (fileData && fileData.base64) {
            const fileName = `${Date.now()}_${fileData.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = path.join(__dirname, "../uploads", fileName);
            const buffer = Buffer.from(fileData.base64, "base64");
            fs.writeFileSync(filePath, buffer);
            finalUrl = `http://localhost:4000/uploads/${fileName}`;
        } else {
            finalUrl = getEmbedUrl(url);
        }

        const result = await dbRun(
            "INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)",
            [songName, title, finalUrl, studentUsername, composer || ""]
        );

        res.json({
            id: result.id,
            songName,
            title,
            url: finalUrl,
            studentUsername,
            composer: composer || ""
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
