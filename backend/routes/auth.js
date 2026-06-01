const express = require("express");
const router = express.Router();
const { dbQueryGet, dbRun } = require("../db/database");

// Login User
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await dbQueryGet(
            "SELECT * FROM users WHERE (LOWER(username) = ? OR LOWER(email) = ?) AND password = ?",
            [username.toLowerCase(), username.toLowerCase(), password]
        );

        if (!user) {
            return res.status(401).json({ error: "Invalid username, email, or password" });
        }

        res.json({
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            teacherCode: user.teacherCode
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to generate a unique 6-character uppercase alphanumeric code
function generateTeacherCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Register User
router.post("/register", async (req, res) => {
    const { email, password, name, role, teacherCode } = req.body;
    
    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "All fields are required, including Name, Email, and Password." });
    }

    if (role === "student" && !teacherCode) {
        return res.status(400).json({ error: "Teacher connection code is required for students." });
    }

    const username = email.trim();

    try {
        const existingEmail = await dbQueryGet("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        let finalTeacherCode = "";

        if (role === "teacher") {
            let codeExists = true;
            let attempts = 0;
            while (codeExists && attempts < 15) {
                const potentialCode = generateTeacherCode();
                const matched = await dbQueryGet("SELECT 1 FROM users WHERE role = 'teacher' AND teacherCode = ?", [potentialCode]);
                if (!matched) {
                    finalTeacherCode = potentialCode;
                    codeExists = false;
                }
                attempts++;
            }
            if (!finalTeacherCode) {
                return res.status(500).json({ error: "Failed to generate unique teacher code. Please try again." });
            }
        } else {
            finalTeacherCode = teacherCode.trim().toUpperCase();
            const teacher = await dbQueryGet("SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?", [finalTeacherCode]);
            if (!teacher) {
                return res.status(400).json({ error: "Teacher Code not found. Please verify with your teacher." });
            }
        }

        await dbRun(
            "INSERT INTO users (username, email, password, name, role, teacherCode) VALUES (?, ?, ?, ?, ?, ?)",
            [username, email.trim(), password, name.trim(), role, finalTeacherCode]
        );

        res.json({ username, email, name, role, teacherCode: finalTeacherCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
