const express = require("express");
const router = express.Router();
const { dbQueryAll, dbRun } = require("../db/database");

// Get Free Practice Stats (Student)
router.get("/:username", async (req, res) => {
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
router.post("/", async (req, res) => {
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

module.exports = router;
