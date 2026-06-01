const express = require("express");
const router = express.Router();
const { dbQueryGet, dbQueryAll, dbRun } = require("../db/database");

// Get Homework for a Specific Student
router.get("/:username", async (req, res) => {
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
router.post("/", async (req, res) => {
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
router.post("/progress", async (req, res) => {
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

module.exports = router;
