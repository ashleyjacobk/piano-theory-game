const express = require("express");
const router = express.Router();
const { dbQueryAll, dbRun } = require("../db/database");

// Get Archived Songs list
router.get("/archive", async (req, res) => {
    try {
        const rows = await dbQueryAll("SELECT songName FROM archived_songs");
        res.json(rows.map(r => r.songName));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archive / Unarchive Song
router.post("/archive", async (req, res) => {
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

module.exports = router;
