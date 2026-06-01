const express = require("express");
const router = express.Router();
const { dbQueryGet, dbQueryAll } = require("../db/database");

// Get unread notifications count & feed for Teacher
router.get("/teacher/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const teacher = await dbQueryGet("SELECT teacherCode FROM users WHERE LOWER(username) = ?", [username.toLowerCase()]);
        if (!teacher) return res.json([]);

        const rows = await dbQueryAll(
            `SELECT vc.*, v.title AS videoTitle, v.songName AS songName, u.name AS studentName, v.studentUsername
             FROM video_comments vc
             JOIN videos v ON vc.videoId = v.id
             JOIN users u ON LOWER(v.studentUsername) = LOWER(u.username)
             WHERE UPPER(u.teacherCode) = UPPER(?) AND vc.readByTeacher = 0`,
            [teacher.teacherCode]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get unread notifications count & feed for Student
router.get("/student/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const rows = await dbQueryAll(
            `SELECT vc.*, v.title AS videoTitle, v.songName AS songName
             FROM video_comments vc
             JOIN videos v ON vc.videoId = v.id
             WHERE LOWER(v.studentUsername) = ? AND vc.readByStudent = 0`,
            [username.toLowerCase()]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
