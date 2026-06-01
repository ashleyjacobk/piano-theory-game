import React, { useState, useEffect } from "react";
import SearchableStudentSelect from "../common/SearchableStudentSelect";
import { assignHomework } from "../../api/homeworkApi";

export default function AssignHomeworkTab({
  students = [],
  teacherProfile = null,
  videos = [],
  fetchData
}) {
  const [hwStudent, setHwStudent] = useState("");
  const [hwType, setHwType] = useState("note"); // "note" | "chord" | "staff" | "practice"
  const [hwSongName, setHwSongName] = useState("");
  const [hwCustomSongName, setHwCustomSongName] = useState("");
  const [hwTarget, setHwTarget] = useState("10");
  const [hwDueDate, setHwDueDate] = useState("");
  const [hwLoading, setHwLoading] = useState(false);
  const [hwMessage, setHwMessage] = useState(null);

  const getNextLessonDateString = (dayName) => {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = DAYS.indexOf(dayName || "Wednesday");
    const validDayIndex = targetDayIndex === -1 ? 3 : targetDayIndex;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayIndex = today.getDay();
    let daysToAdd = validDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);

    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, "0");
    const d = String(nextDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    if (hwStudent && students.length > 0) {
      const selected = students.find((s) => s.username === hwStudent);
      if (selected && selected.lessonDay) {
        setHwDueDate(getNextLessonDateString(selected.lessonDay));
      } else if (teacherProfile) {
        setHwDueDate(getNextLessonDateString(teacherProfile.lessonDay));
      }
    } else if (teacherProfile) {
      setHwDueDate(getNextLessonDateString(teacherProfile.lessonDay));
    }
  }, [hwStudent, students, teacherProfile]);

  const availableSongs = Array.from(new Set(videos.map((v) => v.songName))).filter(Boolean);

  const handleAssignHomework = async (e) => {
    e.preventDefault();
    setHwLoading(true);
    setHwMessage(null);

    if (!hwStudent) {
      setHwMessage({ type: "error", text: "Please select a student from the roster dropdown." });
      setHwLoading(false);
      return;
    }

    const targetNum = parseInt(hwTarget, 10);
    if (isNaN(targetNum) || targetNum <= 0) {
      setHwMessage({ type: "error", text: "Please enter a valid positive target number." });
      setHwLoading(false);
      return;
    }

    const finalSongName =
      hwType === "practice"
        ? hwSongName === "custom"
          ? hwCustomSongName
          : hwSongName
        : null;

    if (hwType === "practice" && !finalSongName) {
      setHwMessage({ type: "error", text: "Please select or type a custom song to practice." });
      setHwLoading(false);
      return;
    }

    try {
      await assignHomework({
        username: hwStudent,
        type: hwType,
        target: targetNum,
        dueDate: hwDueDate,
        songName: finalSongName
      });

      setHwMessage({
        type: "success",
        text: `Homework successfully assigned to @${hwStudent}! 🎉`
      });

      // Reset form fields
      setHwStudent("");
      setHwType("note");
      setHwSongName("");
      setHwCustomSongName("");
      setHwTarget("10");
      if (teacherProfile) {
        setHwDueDate(getNextLessonDateString(teacherProfile.lessonDay));
      }

      // Refresh teacher data
      await fetchData();
    } catch (err) {
      console.error(err);
      setHwMessage({ type: "error", text: err.message || "Failed to assign homework." });
    } finally {
      setHwLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50 w-full max-w-lg text-left font-sans">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 select-none">
          Create Homework Assignment
        </h2>

        {hwMessage && (
          <div
            className={`border p-3 rounded-xl font-semibold text-center mb-6 text-sm ${
              hwMessage.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-red-50 border-red-100 text-red-800"
            }`}
          >
            {hwMessage.text}
          </div>
        )}

        <form onSubmit={handleAssignHomework} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
              Select Student
            </label>
            <SearchableStudentSelect
              value={hwStudent}
              onChange={(val) => setHwStudent(val)}
              students={students}
              placeholder="Search student..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
              Game Mode
            </label>
            <select
              value={hwType}
              onChange={(e) => {
                const val = e.target.value;
                setHwType(val);
                // Update standard targets based on mode
                if (val === "note" || val === "chord" || val === "staff") {
                  setHwTarget("10");
                } else {
                  setHwTarget("15"); // 15 minutes practice
                }
              }}
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
            >
              <option value="note">Identify the Note</option>
              <option value="chord">Chord Builder</option>
              <option value="staff">Staff Reader</option>
              <option value="practice">Practice a Song</option>
            </select>
          </div>

          {hwType === "practice" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                  Select Song to Practice
                </label>
                <select
                  required
                  value={hwSongName}
                  onChange={(e) => setHwSongName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
                >
                  <option value="">-- Select a Song --</option>
                  {availableSongs.map((song) => (
                    <option key={song} value={song}>
                      {song}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Song...</option>
                </select>
              </div>

              {hwSongName === "custom" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                    Custom Song Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moonlight Sonata"
                    value={hwCustomSongName}
                    onChange={(e) => setHwCustomSongName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
              {hwType === "practice" ? "Target Duration (Minutes)" : "Target Score (Correct Answers)"}
            </label>
            <input
              type="number"
              min="1"
              max={hwType === "practice" ? "480" : "100"}
              required
              value={hwTarget}
              onChange={(e) => setHwTarget(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">Due Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                required
                value={hwDueDate}
                onChange={(e) => setHwDueDate(e.target.value)}
                className="flex-1 bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
              />
              <button
                type="button"
                onClick={() => setHwDueDate(getNextLessonDateString(teacherProfile?.lessonDay))}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.95] cursor-pointer select-none"
              >
                Next Lesson
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={hwLoading || students.length === 0}
            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-md font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
          >
            {hwLoading ? "Assigning..." : "Send Homework to Student"}
          </button>
        </form>
      </div>
    </div>
  );
}
