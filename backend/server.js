const express = require("express");
const cors = require("cors");
const { dbRun, dbQueryGet, dbQueryAll } = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 4000;

// Helper to convert regular YouTube URLs to Embed URLs
function getEmbedUrl(url) {
    if (!url) return "";

    // If it's already an embed link, return it
    if (url.includes("youtube.com/embed/")) {
        return url;
    }

    // Standard Watch Link: youtube.com/watch?v=VIDEO_ID
    let videoId = "";
    if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1].split("&")[0];
    }
    // Short Link: youtu.be/VIDEO_ID
    else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    // Embed format fallback
    else {
        return url;
    }

    return `https://www.youtube.com/embed/${videoId}`;
}

// Helper to get past 7 days' date strings in server's local time (YYYY-MM-DD)
function getPast7DaysStrings() {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
    }
    return dates;
}

// Helper to get lesson week boundaries (MM/DD - MM/DD) based on weekly lesson day cycle (e.g. Wednesday)
function getLessonWeekBoundaries(lessonDayName) {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = DAYS.indexOf(lessonDayName || 'Wednesday');
    const validDayIndex = targetDayIndex === -1 ? 3 : targetDayIndex; // Default Wednesday

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Midnight local time
    
    const currentDayIndex = today.getDay(); // Sunday=0, Monday=1, ...
    
    // Calculate the start date (most recent lessonDay <= today)
    let daysToSubtract = currentDayIndex - validDayIndex;
    if (daysToSubtract < 0) {
        daysToSubtract += 7; // Go back to previous week's lessonDay
    }
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToSubtract);
    
    // The end date is 6 days after start date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return { startDate, endDate };
}

// Helper to get all YYYY-MM-DD date strings in a range [start, end]
function getDatesInRange(start, end) {
    const dates = [];
    const curr = new Date(start);
    while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
}

// Helper to format date as MM/DD
function formatMonthDay(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
}


// ==========================================
// API Endpoints (SQLite Refactored)
// ==========================================

// Health Check
app.get("/", (req, res) => {
    res.send("Piano Theory SQLite API Server is active!");
});

// Login User
app.post("/api/login", async (req, res) => {
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

// Register User
app.post("/api/register", async (req, res) => {
    const { username, email, password, name, role, teacherCode } = req.body;
    if (!username || !email || !password || !name || !role || !teacherCode) {
        return res.status(400).json({ error: "All fields are required, including Email and Teacher Code." });
    }

    try {
        const existingUsername = await dbQueryGet("SELECT * FROM users WHERE LOWER(username) = ?", [username.toLowerCase()]);
        if (existingUsername) {
            return res.status(400).json({ error: "Username already exists." });
        }

        const existingEmail = await dbQueryGet("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        const codeUpper = teacherCode.trim().toUpperCase();

        if (role === "teacher") {
            // Teacher Code Blacklist check
            const blacklist = ["JOHNDOE101", "ADMIN", "SYSTEM"];
            if (blacklist.includes(codeUpper)) {
                return res.status(400).json({ error: `The code "${teacherCode}" is blacklisted. Please choose another.` });
            }

            const codeExists = await dbQueryGet("SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?", [codeUpper]);
            if (codeExists) {
                return res.status(400).json({ error: "Teacher Code already in use. Please choose another." });
            }
        } else {
            // Students must connect to an existing teacher code
            const teacher = await dbQueryGet("SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?", [codeUpper]);
            if (!teacher) {
                return res.status(400).json({ error: "Teacher Code not found. Please verify with your teacher." });
            }
        }

        await dbRun(
            "INSERT INTO users (username, email, password, name, role, teacherCode) VALUES (?, ?, ?, ?, ?, ?)",
            [username, email, password, name, role, codeUpper]
        );

        res.json({ username, email, name, role, teacherCode: codeUpper });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Student Roster with Consolidated Stats (Teacher View)
app.get("/api/students", async (req, res) => {
    const { teacherCode } = req.query;
    try {
        // Fetch teacher to determine lesson week boundary cycle day
        const teacher = await dbQueryGet(
            "SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?",
            [teacherCode]
        );
        const lessonDay = teacher ? teacher.lessonDay : 'Wednesday';
        
        // Calculate lesson week range boundaries
        const { startDate, endDate } = getLessonWeekBoundaries(lessonDay);
        const weekDates = getDatesInRange(startDate, endDate);
        const weekLabel = `${formatMonthDay(startDate)} - ${formatMonthDay(endDate)}`;

        const students = await dbQueryAll(
            "SELECT * FROM users WHERE role = 'student' AND teacherCode = ?",
            [teacherCode]
        );

        const roster = [];
        for (const student of students) {
            const sUsername = student.username;

            const logs = await dbQueryAll(
                "SELECT * FROM practice_logs WHERE username = ? ORDER BY id DESC",
                [sUsername]
            );
            // Sum minutes strictly for the calculated lesson week
            const totalMinutes = logs
                .filter(log => weekDates.includes(log.date))
                .reduce((sum, log) => sum + log.minutes, 0);

            const sHomework = await dbQueryAll(
                "SELECT * FROM homework WHERE username = ?",
                [sUsername]
            );
            const sFreePractice = await dbQueryAll(
                "SELECT * FROM free_practice WHERE username = ? ORDER BY id DESC",
                [sUsername]
            );

            // Format boolean Completed flag since SQLite uses 0/1
            const formattedHomework = sHomework.map(h => ({
                ...h,
                completed: !!h.completed
            }));

            roster.push({
                username: sUsername,
                name: student.name,
                totalMinutes,
                homework: formattedHomework,
                practiceLogs: logs,
                freePractice: sFreePractice,
                weekLabel
            });
        }

        res.json(roster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Homework for a Specific Student
app.get("/api/homework/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const rows = await dbQueryAll(
            "SELECT * FROM homework WHERE LOWER(username) = ?",
            [username.toLowerCase()]
        );
        res.json(rows.map(h => ({ ...h, completed: !!h.completed })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign New Homework (Teacher)
app.post("/api/homework", async (req, res) => {
    const { username, type, target, dueDate, songName } = req.body;
    if (!username || !type || !target || !dueDate) {
        return res.status(400).json({ error: "Missing required fields (username, type, target, dueDate)" });
    }

    try {
        const assignedAt = new Date().toISOString().split("T")[0];

        const result = await dbRun(
            "INSERT INTO homework (username, type, target, progress, completed, assignedAt, dueDate, songName) VALUES (?, ?, ?, 0, 0, ?, ?, ?)",
            [username, type, parseInt(target), assignedAt, dueDate, songName || null]
        );

        res.json({
            id: result.id,
            username,
            type,
            target: parseInt(target),
            progress: 0,
            completed: false,
            assignedAt,
            dueDate,
            songName: songName || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Homework Progress (Student)
app.post("/api/homework/progress", async (req, res) => {
    const { id, username } = req.body;
    try {
        const hwItem = await dbQueryGet(
            "SELECT * FROM homework WHERE id = ? AND LOWER(username) = ?",
            [parseInt(id), username.toLowerCase()]
        );

        if (!hwItem) {
            return res.status(404).json({ error: "Homework assignment not found" });
        }

        if (!hwItem.completed) {
            const nextProgress = hwItem.progress + 1;
            const isCompleted = nextProgress >= hwItem.target ? 1 : 0;

            await dbRun(
                "UPDATE homework SET progress = ?, completed = ? WHERE id = ?",
                [nextProgress, isCompleted, hwItem.id]
            );

            hwItem.progress = nextProgress;
            hwItem.completed = !!isCompleted;
        } else {
            hwItem.completed = !!hwItem.completed;
        }

        res.json(hwItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Practice Logs (Student)
app.get("/api/practice-logs/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const rows = await dbQueryAll(
            "SELECT * FROM practice_logs WHERE LOWER(username) = ? ORDER BY id DESC",
            [username.toLowerCase()]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add New Practice Log (Student)
app.post("/api/practice-logs", async (req, res) => {
    const { username, minutes, notes, homeworkId, songName } = req.body;
    if (!username || !minutes) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const date = new Date().toISOString().split("T")[0];
        const result = await dbRun(
            "INSERT INTO practice_logs (username, minutes, date, notes, songName) VALUES (?, ?, ?, ?, ?)",
            [username, parseInt(minutes), date, notes || "", songName || null]
        );

        // Update progress of linked practice homework assignment
        if (homeworkId) {
            const hwId = parseInt(homeworkId);
            const hwItem = await dbQueryGet(
                "SELECT * FROM homework WHERE id = ? AND LOWER(username) = ?",
                [hwId, username.toLowerCase()]
            );
            if (hwItem) {
                const nextProgress = hwItem.progress + parseInt(minutes);
                const isCompleted = nextProgress >= hwItem.target ? 1 : 0;
                await dbRun(
                    "UPDATE homework SET progress = ?, completed = ? WHERE id = ?",
                    [nextProgress, isCompleted, hwId]
                );
            }
        }

        res.json({
            id: result.id,
            username,
            minutes: parseInt(minutes),
            date,
            notes: notes || "",
            songName: songName || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Free Practice Stats (Student)
app.get("/api/free-practice/:username", async (req, res) => {
    const { username } = req.params;
    try {
        const rows = await dbQueryAll(
            "SELECT * FROM free_practice WHERE LOWER(username) = ? ORDER BY id DESC",
            [username.toLowerCase()]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Free Practice Score (Student)
app.post("/api/free-practice", async (req, res) => {
    const { username, type, score } = req.body;
    if (!username || !type || score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const date = new Date().toISOString().split("T")[0];
        const result = await dbRun(
            "INSERT INTO free_practice (username, type, score, date) VALUES (?, ?, ?, ?)",
            [username, type, parseInt(score), date]
        );

        res.json({
            id: result.id,
            username,
            type,
            score: parseInt(score),
            date
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Videos (filtered by student username or teacher code if provided)
app.get("/api/videos", async (req, res) => {
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
app.get("/api/videos/:videoId/comments", async (req, res) => {
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
app.post("/api/videos/:videoId/comments", async (req, res) => {
    const { videoId } = req.params;
    const { username, name, text } = req.body;
    if (!username || !name || !text) {
        return res.status(400).json({ error: "Missing required fields (username, name, text)" });
    }

    try {
        const createdAt = new Date().toISOString();
        const result = await dbRun(
            "INSERT INTO video_comments (videoId, username, name, text, createdAt) VALUES (?, ?, ?, ?, ?)",
            [parseInt(videoId), username, name, text.trim(), createdAt]
        );

        res.json({
            id: result.id,
            videoId: parseInt(videoId),
            username,
            name,
            text: text.trim(),
            createdAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload Video Lesson (Teacher, targeted to specific student)
app.post("/api/videos", async (req, res) => {
    const { songName, title, url, studentUsername, composer } = req.body;
    if (!songName || !title || !url || !studentUsername) {
        return res.status(400).json({ error: "Missing required fields (songName, title, url, studentUsername)" });
    }

    try {
        const embedUrl = getEmbedUrl(url);
        const result = await dbRun(
            "INSERT INTO videos (songName, title, url, studentUsername, composer) VALUES (?, ?, ?, ?, ?)",
            [songName, title, embedUrl, studentUsername, composer || ""]
        );

        res.json({
            id: result.id,
            songName,
            title,
            url: embedUrl,
            studentUsername,
            composer: composer || ""
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Student Profile detail including teacher name and email
app.get("/api/student-profile/:username", async (req, res) => {
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
            teacherCode: student.teacherCode
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Teacher Profile detail
app.get("/api/teacher-profile/:username", async (req, res) => {
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
app.post("/api/teacher-profile", async (req, res) => {
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
app.delete("/api/users/:username", async (req, res) => {
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

// Get Archived Songs list
app.get("/api/songs/archive", async (req, res) => {
    try {
        const rows = await dbQueryAll("SELECT songName FROM archived_songs");
        res.json(rows.map(r => r.songName));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archive / Unarchive Song
app.post("/api/songs/archive", async (req, res) => {
    const { songName, archived } = req.body;
    if (!songName) {
        return res.status(400).json({ error: "Missing required songName field" });
    }

    try {
        if (archived) {
            await dbRun("INSERT OR IGNORE INTO archived_songs (songName) VALUES (?)", [songName]);
        } else {
            await dbRun("DELETE FROM archived_songs WHERE songName = ?", [songName]);
        }
        res.json({ songName, archived });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});