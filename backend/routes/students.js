const express = require("express");
const router = express.Router();
const { dbQueryGet, dbQueryAll, dbRun } = require("../db/database");
const { getLessonWeekBoundaries, getDatesInRange, formatMonthDay } = require("../utils/dates");

// Get Student Roster with Consolidated Stats (Teacher View)
router.get("/", async (req, res) => {
    const { teacherCode } = req.query;
    try {
        const teacher = await dbQueryGet(
            "SELECT * FROM users WHERE role = 'teacher' AND teacherCode = ?",
            [teacherCode]
        );
        const fallbackLessonDay = teacher ? teacher.lessonDay : 'Wednesday';

        const students = await dbQueryAll(
            "SELECT * FROM users WHERE role = 'student' AND teacherCode = ?",
            [teacherCode]
        );

        const roster = [];
        for (const student of students) {
            const sUsername = student.username;
            const sLessonDay = student.lessonDay || fallbackLessonDay;
            
            const { startDate: sStartDate, endDate: sEndDate } = getLessonWeekBoundaries(sLessonDay);
            const sWeekDates = getDatesInRange(sStartDate, sEndDate);
            const sWeekLabel = `${formatMonthDay(sStartDate)} - ${formatMonthDay(sEndDate)}`;

            const logs = await dbQueryAll(
                "SELECT * FROM practice_logs WHERE username = ? ORDER BY id DESC",
                [sUsername]
            );
            const totalMinutes = logs
                .filter(log => sWeekDates.includes(log.date))
                .reduce((sum, log) => sum + log.minutes, 0);

            const sHomework = await dbQueryAll(
                "SELECT * FROM homework WHERE username = ?",
                [sUsername]
            );
            const sFreePractice = await dbQueryAll(
                "SELECT * FROM free_practice WHERE username = ? ORDER BY id DESC",
                [sUsername]
            );

            const formattedHomework = sHomework.map(h => ({
                ...h,
                completed: !!h.completed
            }));

            roster.push({
                username: sUsername,
                name: student.name,
                lessonDay: sLessonDay,
                totalMinutes,
                homework: formattedHomework,
                practiceLogs: logs,
                freePractice: sFreePractice,
                weekLabel: sWeekLabel
            });
        }

        res.json(roster);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Student Lesson Day (Teacher)
router.post("/:username/lesson-day", async (req, res) => {
    const { username } = req.params;
    const { lessonDay } = req.body;
    if (!lessonDay) {
        return res.status(400).json({ error: "Missing lessonDay" });
    }
    try {
        await dbRun(
            "UPDATE users SET lessonDay = ? WHERE LOWER(username) = ? AND role = 'student'",
            [lessonDay, username.toLowerCase()]
        );
        res.json({ success: true, lessonDay });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
