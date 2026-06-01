const express = require("express");
const router = express.Router();
const { dbQueryGet, dbQueryAll, dbRun } = require("../db/database");

// Get Practice Logs (Student)
router.get("/:username", async (req, res) => {
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
router.post("/", async (req, res) => {
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

module.exports = router;
