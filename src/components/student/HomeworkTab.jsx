import React, { useState, useEffect } from "react";
import PianoKeyboard from "../common/PianoKeyboard";
import StaffReaderGame from "./StaffReaderGame";
import { generateChordPrompt, generateFindNotePrompt, isSameChord } from "../../game/prompts";
import { isEnharmonicallyEquivalent } from "../../game/notes";
import { playPianoNote } from "../../utils/audio";
import { updateHomeworkProgress } from "../../api/homeworkApi";

export default function HomeworkTab({
  user,
  homeworkList = [],
  isPlayingHW,
  setIsPlayingHW,
  hwActiveItem,
  setHwActiveItem,
  hwCount,
  setHwCount,
  fetchStudentData,
  setLogHwLink,
  setActiveTab,
  staffHighScore,
  setStaffHighScore
}) {
  const [hwSubTab, setHwSubTab] = useState("upcoming"); // "upcoming" | "completed" | "past"
  const [hwPrompt, setHwPrompt] = useState(null);
  const [hwSelectedNotes, setHwSelectedNotes] = useState([]);
  const [hwFeedback, setHwFeedback] = useState(null);
  const [chordTries, setChordTries] = useState(0);

  const isExpired = (dueDateStr) => {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr + "T23:59:59");
    return due < today;
  };

  const upcomingHW = homeworkList.filter((h) => !h.completed && !isExpired(h.dueDate));
  const completedHW = homeworkList.filter((h) => h.completed);
  const pastHW = homeworkList.filter((h) => !h.completed && isExpired(h.dueDate));

  let displayedHWList = [];
  if (hwSubTab === "upcoming") displayedHWList = upcomingHW;
  else if (hwSubTab === "completed") displayedHWList = completedHW;
  else if (hwSubTab === "past") displayedHWList = pastHW;

  const initializeHomeworkGame = (item) => {
    if (!item) return;
    setChordTries(0);
    setHwFeedback(null);
    setHwSelectedNotes([]);
    if (item.type === "note") {
      setHwPrompt(generateFindNotePrompt());
    } else if (item.type === "chord") {
      setHwPrompt(generateChordPrompt());
    }
  };

  useEffect(() => {
    if (isPlayingHW && hwActiveItem && hwActiveItem.type !== "staff" && hwActiveItem.type !== "practice") {
      initializeHomeworkGame(hwActiveItem);
    }
  }, [isPlayingHW, hwActiveItem]);

  const handleHwNoteClick = (note) => {
    playPianoNote(note);
    if (hwActiveItem.type === "note") {
      setHwSelectedNotes([note]);
    } else {
      if (hwSelectedNotes.includes(note)) {
        setHwSelectedNotes((prev) => prev.filter((n) => n !== note));
      } else {
        setHwSelectedNotes((prev) => [...prev, note]);
      }
    }
  };

  const handleHwSubmit = async () => {
    if (!hwPrompt || !hwActiveItem) return;

    let correct = false;
    if (hwActiveItem.type === "chord") {
      correct = isSameChord(hwSelectedNotes, hwPrompt.answer);
    } else {
      correct = hwSelectedNotes.length === 1 && isEnharmonicallyEquivalent(hwSelectedNotes[0], hwPrompt.answer);
    }

    if (correct) {
      setHwFeedback("Correct!");
      setChordTries(0);

      try {
        const updated = await updateHomeworkProgress(hwActiveItem.id, user.username);
        setHwCount(updated.progress);

        if (updated.completed) {
          setHwFeedback("Huzzah! Assignment Completed! 🏆");
          setTimeout(() => {
            setHwActiveItem(null);
            setIsPlayingHW(false);
            fetchStudentData();
          }, 2000);
          return;
        }

        setTimeout(() => {
          setHwPrompt(hwActiveItem.type === "chord" ? generateChordPrompt() : generateFindNotePrompt());
          setHwSelectedNotes([]);
          setHwFeedback(null);
        }, 1000);
      } catch (err) {
        console.error("Error updating progress:", err);
      }
    } else {
      const nextTries = chordTries + 1;
      setChordTries(nextTries);

      if (hwActiveItem.type === "chord" && nextTries >= 3) {
        setHwFeedback("Revealing answer...");
        setHwSelectedNotes(hwPrompt.answer);

        setTimeout(() => {
          setHwPrompt(generateChordPrompt());
          setHwSelectedNotes([]);
          setHwFeedback(null);
          setChordTries(0);
        }, 2500);
      } else {
        setHwFeedback("Try again!");
        setHwSelectedNotes([]);
        setTimeout(() => setHwFeedback(null), 1000);
      }
    }
  };

  return (
    <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0] max-w-2xl mx-auto flex flex-col items-center">
      {!isPlayingHW ? (
        <div className="w-full text-center space-y-6">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 select-none">
            Your Assignments
          </h2>

          {/* Sub-tabs menu */}
          <div className="flex gap-2.5 mb-6 w-full justify-center select-none">
            <button
              type="button"
              onClick={() => setHwSubTab("upcoming")}
              className={`px-4 py-2.5 border-3 border-slate-800 rounded-2xl font-black text-xs transition active:translate-y-0.5 hover:scale-[1.03] cursor-pointer ${
                hwSubTab === "upcoming"
                  ? "bg-emerald-300 text-slate-800 shadow-[2px_2px_0px_#1e293b]"
                  : "bg-white text-slate-500 hover:bg-emerald-50 shadow-[2px_2px_0px_#1e293b]"
              }`}
            >
              Upcoming ({upcomingHW.length})
            </button>
            <button
              type="button"
              onClick={() => setHwSubTab("completed")}
              className={`px-4 py-2.5 border-3 border-slate-800 rounded-2xl font-black text-xs transition active:translate-y-0.5 hover:scale-[1.03] cursor-pointer ${
                hwSubTab === "completed"
                  ? "bg-emerald-300 text-slate-800 shadow-[2px_2px_0px_#1e293b]"
                  : "bg-white text-slate-500 hover:bg-emerald-50 shadow-[2px_2px_0px_#1e293b]"
              }`}
            >
              Completed ({completedHW.length})
            </button>
            <button
              type="button"
              onClick={() => setHwSubTab("past")}
              className={`px-4 py-2.5 border-3 border-slate-800 rounded-2xl font-black text-xs transition active:translate-y-0.5 hover:scale-[1.03] cursor-pointer ${
                hwSubTab === "past"
                  ? "bg-emerald-300 text-slate-800 shadow-[2px_2px_0px_#1e293b]"
                  : "bg-white text-slate-500 hover:bg-emerald-50 shadow-[2px_2px_0px_#1e293b]"
              }`}
            >
              Past History ({pastHW.length})
            </button>
          </div>

          {displayedHWList.length === 0 ? (
            <div className="border-4 border-dashed border-emerald-200 rounded-[2rem] p-8 bg-emerald-50/30">
              <p className="text-xl font-bold text-emerald-600">
                {hwSubTab === "upcoming"
                  ? "All upcoming homework is finished! Excellent job, superstar!"
                  : hwSubTab === "completed"
                  ? "No completed assignments yet. You got this!"
                  : "No expired assignments in your history."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-md mx-auto text-left">
              {displayedHWList.map((hw) => (
                <div
                  key={hw.id}
                  className="border-4 border-slate-800 rounded-[2rem] p-5 bg-emerald-50/10 shadow-[4px_4px_0px_#fef08a] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-black text-emerald-600 uppercase tracking-wide">
                        {hw.type === "note"
                          ? "Note Matcher"
                          : hw.type === "chord"
                          ? "Chord Builder"
                          : hw.type === "staff"
                          ? "Staff Reader"
                          : "Practice Song"}
                      </h3>
                      <span className="bg-slate-100 border-2 border-slate-800 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-700">
                        Due: {hw.dueDate || "No limit"}
                      </span>
                    </div>
                    <p className="font-bold text-slate-600 mt-1 text-xs">
                      {hw.type === "practice" ? (
                        <>
                          Practice <span className="font-black text-emerald-600">"{hw.songName || "Assigned Song"}"</span> for <span className="font-black text-emerald-500">{hw.target}</span> minutes.
                        </>
                      ) : hw.type === "staff" ? (
                        <>
                          Complete <span className="font-black text-emerald-500">{hw.target}</span> songs on the staff.
                        </>
                      ) : (
                        <>
                          Successfully answer <span className="font-black text-emerald-500">{hw.target}</span> questions.
                        </>
                      )}
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between font-black text-[9px] mb-1 text-slate-500">
                        <span>Current Progress</span>
                        <span>{hw.progress} / {hw.target} {hw.type === "practice" ? "minutes" : "completed"}</span>
                      </div>
                      <div className="w-full bg-emerald-50 border-2 border-slate-800 h-3 rounded-full overflow-hidden relative">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (hw.progress / hw.target) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {hwSubTab === "upcoming" && (
                    <button
                      onClick={() => {
                        if (hw.type === "practice") {
                          setLogHwLink(hw.id.toString());
                          setActiveTab("logs");
                        } else {
                          setHwActiveItem(hw);
                          setHwCount(hw.progress);
                          setIsPlayingHW(true);
                        }
                      }}
                      className="w-full mt-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      {hw.type === "practice" ? "Log Practice Session" : "Start Assignment"}
                    </button>
                  )}

                  {hwSubTab === "completed" && (
                    <div className="w-full mt-4 py-1.5 bg-emerald-100 text-emerald-800 border-2 border-emerald-500 rounded-xl text-[10px] font-black text-center">
                      Completed!
                    </div>
                  )}

                  {hwSubTab === "past" && (
                    <div className="w-full mt-4 py-1.5 bg-red-100 text-red-800 border-2 border-red-500 rounded-xl text-[10px] font-black text-center">
                      Expired / Overdue
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : hwActiveItem.type === "staff" ? (
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-6 w-full">
            <h3 className="font-black text-lg text-emerald-600">
              Homework Arcade: Staff Reader
            </h3>
            <button
              onClick={() => {
                setIsPlayingHW(false);
                fetchStudentData();
              }}
              className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-100 border-2 border-slate-800 text-slate-800 rounded-xl font-black text-xs shadow-[2px_2px_0px_#a7f3d0] cursor-pointer hover:scale-[1.03] transition-all active:translate-y-0.5"
            >
              Quit Game
            </button>
          </div>
          <StaffReaderGame
            user={user}
            isHw={true}
            hwActiveItem={hwActiveItem}
            hwCount={hwCount}
            setHwCount={setHwCount}
            setHwActiveItem={setHwActiveItem}
            setIsPlayingHW={setIsPlayingHW}
            fetchStudentData={fetchStudentData}
            staffHighScore={staffHighScore}
            setStaffHighScore={setStaffHighScore}
          />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-6 w-full">
            <h3 className="font-black text-lg text-emerald-600 select-none">
              Homework Arcade: {hwActiveItem.type === "note" ? "Note Matcher" : "Chord Builder"}
            </h3>
            <button
              onClick={() => {
                setIsPlayingHW(false);
                fetchStudentData();
              }}
              className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-100 border-2 border-slate-800 text-slate-800 rounded-xl font-black text-xs shadow-[2px_2px_0px_#a7f3d0] cursor-pointer hover:scale-[1.03] transition-all active:translate-y-0.5"
            >
              Quit Game
            </button>
          </div>

          <div className="bg-yellow-100 border-2 border-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-[2px_2px_0px_#a7f3d0] mb-4 select-none">
            Progress: {hwCount} / {hwActiveItem.target} Correct
          </div>

          {hwPrompt && (
            <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short select-none">
              {hwPrompt.question}
            </div>
          )}

          <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse select-none">
            {hwFeedback}
          </div>

          <PianoKeyboard
            selectedNotes={hwSelectedNotes}
            onNoteClick={handleHwNoteClick}
            isNoteMode={hwActiveItem.type === "note"}
            theme="emerald"
          />

          <div className="flex flex-col items-center w-full mt-6">
            <button
              onClick={handleHwSubmit}
              className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
            >
              {hwActiveItem.type === "chord" ? "Submit Chord" : "Submit Note"}
            </button>
            {hwActiveItem.type === "chord" && (
              <div className="mt-4 font-bold text-xs bg-emerald-50/20 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 shadow-[1px_1px_0px_#fef08a] select-none">
                Selected: {hwSelectedNotes.join(" ") || "None"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
