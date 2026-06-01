import React, { useState, useEffect } from "react";
import { addPracticeLog } from "../../api/profileApi";

export default function PracticeLogTab({
  user,
  homeworkList = [],
  videos = [],
  practiceLogs = [],
  logHwLink = "",
  setLogHwLink,
  fetchStudentData
}) {
  const [logMinutes, setLogMinutes] = useState("");
  const [logSongLink, setLogSongLink] = useState("");
  const [logCustomSongName, setLogCustomSongName] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [logMessage, setLogMessage] = useState(null);

  // Auto-sync if logHwLink changes
  useEffect(() => {
    if (logHwLink) {
      // Find linked homework item
      const linkedHw = homeworkList.find((h) => h.id.toString() === logHwLink);
      if (linkedHw && linkedHw.songName) {
        // Linked to video song?
        const matchingVideoSong = videos.find((v) => v.songName === linkedHw.songName);
        if (matchingVideoSong) {
          setLogSongLink(linkedHw.songName);
        } else {
          setLogSongLink("custom");
          setLogCustomSongName(linkedHw.songName);
        }
      }
    }
  }, [logHwLink, homeworkList, videos]);

  const handleHwDropdownChange = (e) => {
    const val = e.target.value;
    setLogHwLink(val);
    if (!val) {
      setLogSongLink("");
      setLogCustomSongName("");
      return;
    }
    const linkedHw = homeworkList.find((h) => h.id.toString() === val);
    if (linkedHw && linkedHw.songName) {
      const matchingVideoSong = videos.find((v) => v.songName === linkedHw.songName);
      if (matchingVideoSong) {
        setLogSongLink(linkedHw.songName);
        setLogCustomSongName("");
      } else {
        setLogSongLink("custom");
        setLogCustomSongName(linkedHw.songName);
      }
    }
  };

  const handleLogPractice = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    setLogMessage(null);

    const minutesNum = parseInt(logMinutes, 10);
    if (isNaN(minutesNum) || minutesNum <= 0) {
      setLogMessage({ type: "error", text: "Please enter positive practice minutes" });
      setLogLoading(false);
      return;
    }

    const finalSongName = logSongLink === "custom" ? logCustomSongName : logSongLink;

    try {
      await addPracticeLog({
        username: user.username,
        minutes: minutesNum,
        notes: logNotes.trim(),
        homeworkId: logHwLink ? parseInt(logHwLink, 10) : null,
        songName: finalSongName.trim() || null
      });

      setLogMessage({ type: "success", text: "Superstar! Your practice log was recorded successfully! 🌟" });
      
      // Reset form fields
      setLogMinutes("");
      setLogNotes("");
      setLogHwLink("");
      setLogSongLink("");
      setLogCustomSongName("");

      // Refresh student dashboard data
      await fetchStudentData();
    } catch (err) {
      console.error("Error saving log:", err);
      setLogMessage({ type: "error", text: err.message || "Failed to log practice session" });
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Form */}
      <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0] h-fit">
        <h2 className="text-xl font-black text-emerald-600 mb-4 border-b-3 border-slate-100 pb-2 select-none">
          Log Practice Session
        </h2>

        {logMessage && (
          <div
            className={`border-3 border-slate-800 p-2 rounded-xl font-bold text-center text-xs mb-4 ${
              logMessage.type === "success" ? "bg-emerald-100 text-emerald-900" : "bg-amber-200 text-amber-950"
            }`}
          >
            {logMessage.text}
          </div>
        )}

        <form onSubmit={handleLogPractice} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-600 mb-1 select-none">
              Practice Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="480"
              required
              placeholder="45"
              value={logMinutes}
              onChange={(e) => setLogMinutes(e.target.value)}
              className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a]"
            />
          </div>

          {homeworkList.filter((h) => !h.completed).length > 0 && (
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1 select-none">
                Link to Homework Assignment
              </label>
              <select
                value={logHwLink}
                onChange={handleHwDropdownChange}
                className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a] cursor-pointer"
              >
                <option value="">-- General Practice (No Assignment) --</option>
                {homeworkList
                  .filter((h) => !h.completed)
                  .map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.type === "practice"
                        ? `Practice: "${h.songName || "Assigned Song"}" (${h.progress} / ${h.target} mins completed)`
                        : h.type === "note"
                        ? `Identify Notes Game: ${h.target} notes (${h.progress} / ${h.target} completed)`
                        : h.type === "chord"
                        ? `Chord Builder Game: ${h.target} chords (${h.progress} / ${h.target} completed)`
                        : h.type === "staff"
                        ? `Staff Reader Game: ${h.target} songs (${h.progress} / ${h.target} completed)`
                        : `Assignment: ${h.type} (${h.progress} / ${h.target})`}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1 select-none">Link to a Song</label>
            <select
              value={logSongLink}
              onChange={(e) => {
                setLogSongLink(e.target.value);
                if (e.target.value !== "custom") {
                  setLogCustomSongName("");
                }
              }}
              className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a] cursor-pointer"
            >
              <option value="">-- No Song Linked --</option>
              {Array.from(new Set(videos.map((v) => v.songName)))
                .filter(Boolean)
                .map((song) => (
                  <option key={song} value={song}>
                    {song}
                  </option>
                ))}
              <option value="custom">-- Type Custom Song Name --</option>
            </select>
          </div>

          {logSongLink === "custom" && (
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1 select-none">Custom Song Name</label>
              <input
                type="text"
                required
                placeholder="Moonlight Sonata"
                value={logCustomSongName}
                onChange={(e) => setLogCustomSongName(e.target.value)}
                className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1 select-none">What did you work on?</label>
            <textarea
              required
              rows="3"
              placeholder="practiced scales"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a]"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={logLoading}
            className="w-full mt-2 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-md font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
          >
            {logLoading ? "Saving..." : "Log Practice Duration"}
          </button>
        </form>
      </div>

      {/* History Feed */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-emerald-600 border-b-3 border-slate-100 pb-1 select-none">
          Practice Journal
        </h2>
        {practiceLogs.length === 0 ? (
          <div className="bg-white border-4 border-slate-800 rounded-[2rem] p-6 text-center shadow-[4px_4px_0px_#a7f3d0]">
            <p className="font-bold text-slate-400 text-sm">No logs posted yet. Let's start practicing.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
            {practiceLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white border-3 border-slate-800 p-4 rounded-2xl shadow-[3px_3px_0px_#fef08a] hover:scale-[1.01] transition-all text-left"
              >
                <div className="flex justify-between font-black text-xs text-emerald-600 mb-2">
                  <span>Date: {log.date}</span>
                  <span className="bg-emerald-50 border border-slate-200 px-2 py-0.5 rounded-lg select-none">
                    {log.minutes} minutes
                  </span>
                </div>
                {log.songName && (
                  <div className="mb-2 select-none">
                    <span className="inline-block text-[10px] font-black text-slate-800 bg-yellow-200 border-2 border-slate-800 px-2 py-0.5 rounded-lg">
                      Song: {log.songName}
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-slate-700 leading-relaxed">"{log.notes}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
