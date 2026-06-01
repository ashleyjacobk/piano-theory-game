import React, { useState, useEffect } from "react";
import SearchableStudentSelect from "../common/SearchableStudentSelect";
import { assignHomework } from "../../api/homeworkApi";

export default function AssignHomeworkTab({
  students = [],
  videos = [],
  archivedSongs = [],
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

  const getDefaultDueDateString = () => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 7);

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, "0");
    const d = String(targetDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    setHwDueDate(getDefaultDueDateString());
  }, [hwStudent]);

  useEffect(() => {
    setHwSongName("");
    setHwCustomSongName("");
  }, [hwStudent]);

  const availableSongs = Array.from(
    new Set(
      videos
        .filter((video) => {
          const belongsToSelectedStudent =
            video.studentUsername?.toLowerCase() === hwStudent.toLowerCase();

          const isActiveSong = !archivedSongs.includes(video.songName);

          return belongsToSelectedStudent && isActiveSong;
        })
        .map((video) => video.songName)
    )
  ).filter(Boolean);
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
        text: `Homework successfully assigned to ${hwStudent}! 🎉`
      });

      // Reset form fields
      setHwStudent("");
      setHwType("note");
      setHwSongName("");
      setHwCustomSongName("");
      setHwTarget("10");
      setHwDueDate(getDefaultDueDateString());

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
            className={`border p-3 rounded-xl font-semibold text-center mb-6 text-sm ${hwMessage.type === "success"
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
              students={students}
              value={hwStudent}
              onChange={setHwStudent}
              placeholder="Search student..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
              Assignment Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setHwType("note");
                  setHwTarget("10");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${hwType === "note"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
              >
                Note Match
              </button>
              <button
                type="button"
                onClick={() => {
                  setHwType("chord");
                  setHwTarget("10");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${hwType === "chord"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
              >
                Chord Build
              </button>
              <button
                type="button"
                onClick={() => {
                  setHwType("staff");
                  setHwTarget("10");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${hwType === "staff"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
              >
                Staff Reader
              </button>
              <button
                type="button"
                onClick={() => {
                  setHwType("practice");
                  setHwTarget("15");
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${hwType === "practice"
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
              >
                Practice Log
              </button>
            </div>
          </div>

          {hwType === "practice" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 select-none">
                  Select Song to Practice
                </label>
                <select
                  value={hwSongName}
                  onChange={(e) => setHwSongName(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
                >
                  <option value="">-- Choose Song --</option>
                  {availableSongs.map((song) => (
                    <option key={song} value={song}>
                      {song}
                    </option>
                  ))}
                  <option value="custom">-- Type Custom Song Name --</option>
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
            <input
              type="date"
              required
              value={hwDueDate}
              onChange={(e) => setHwDueDate(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer font-semibold"
            />
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
