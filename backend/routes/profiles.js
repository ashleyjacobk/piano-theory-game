const express = require("express");
const router = express.Router();
const { dbQueryGet, dbQueryAll, dbRun } = require("../db/database");

// Get Student Profile detail including teacher name and email
router.get("/student-profile/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const student = await dbQueryGet(
            "SELECT * FROM users WHERE LOWER(username) = ? AND role = 'student'",
            [username.toLowerCase()]
        );
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }

        const teacher = await dbQueryGet(
            "SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?",
            [student.teacherCode]
        );

        res.json({
            name: student.name,
            username: student.username,
            email: student.email,
            teacherName: teacher ? teacher.name : "Unknown Teacher",
            teacherCode: student.teacherCode,
            lessonDay: student.lessonDay || (teacher ? teacher.lessonDay : "Wednesday")
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Teacher Profile detail
router.get("/teacher-profile/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const teacher = await dbQueryGet(
            "SELECT * FROM users WHERE LOWER(username) = ? AND role = 'teacher'",
            [username.toLowerCase()]
        );
        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        res.json({
            name: teacher.name,
            username: teacher.username,
            email: teacher.email,
            teacherCode: teacher.teacherCode,
            lessonDay: teacher.lessonDay || "Wednesday"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Teacher Profile Detail (including Lesson Day)
router.post("/teacher-profile", async (req, res) => {
    const { username, name, email, lessonDay } = req.body;
    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    try {
        await dbRun(
            "UPDATE users SET name = ?, email = ?, lessonDay = ? WHERE LOWER(username) = ? AND role = 'teacher'",
            [name, email, lessonDay || "Wednesday", username.toLowerCase()]
        );
        res.json({ success: true, message: "Profile updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User Account and Cascade Cleanup
router.delete("/users/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const user = await dbQueryGet("SELECT * FROM users WHERE LOWER(username) = ?", [username.toLowerCase()]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const uName = user.username;
        const uRole = user.role;

        if (uRole === "teacher") {
            // Delete teacher
            await dbRun("DELETE FROM users WHERE username = ?", [uName]);

            // Delete all students connected to this teacher
            const students = await dbQueryAll("SELECT username FROM users WHERE role = 'student' AND teacherCode = ?", [user.teacherCode]);
            for (const student of students) {
                const sName = student.username;
                await dbRun("DELETE FROM users WHERE username = ?", [sName]);
                await dbRun("DELETE FROM homework WHERE username = ?", [sName]);
                await dbRun("DELETE FROM practice_logs WHERE username = ?", [sName]);
                await dbRun("DELETE FROM free_practice WHERE username = ?", [sName]);
                await dbRun("DELETE FROM videos WHERE studentUsername = ?", [sName]);
            }
        } else {
            // Delete student and student's details
            await dbRun("DELETE FROM users WHERE username = ?", [uName]);
            await dbRun("DELETE FROM homework WHERE username = ?", [uName]);
            await dbRun("DELETE FROM practice_logs WHERE username = ?", [uName]);
            await dbRun("DELETE FROM free_practice WHERE username = ?", [uName]);
            await dbRun("DELETE FROM videos WHERE studentUsername = ?", [uName]);
        }

        res.json({ success: true, message: `Account "${uName}" and associated data permanently deleted.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
