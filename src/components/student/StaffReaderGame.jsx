import React, { useState, useEffect } from "react";
import PianoKeyboard from "../common/PianoKeyboard";
import { playPianoNote } from "../../utils/audio";
import { isEnharmonicallyEquivalent } from "../../game/notes";
import { getTrebleStep, getBassStep } from "../../game/staff";

const RANDOM_NOTE_POOL = ["C", "D", "E", "F", "G", "A", "B"];

const generateRandomStaffNotes = (length = 6) => {
  const notes = [];
  for (let i = 0; i < length; i++) {
    const randomNote = RANDOM_NOTE_POOL[Math.floor(Math.random() * RANDOM_NOTE_POOL.length)];
    notes.push(randomNote);
  }
  return {
    name: "Random Note Practice",
    notes: notes
  };
};

export default function StaffReaderGame({
  user,
  isHw = false,
  hwActiveItem = null,
  hwCount = 0,
  setHwCount,
  setHwActiveItem,
  setIsPlayingHW,
  fetchStudentData,
  staffHighScore,
  setStaffHighScore
}) {
  const [staffActiveSong, setStaffActiveSong] = useState(null);
  const [staffClef, setStaffClef] = useState("treble"); // "treble" | "bass"
  const [staffActiveInputIdx, setStaffActiveInputIdx] = useState(0);
  const [staffUserAnswers, setStaffUserAnswers] = useState([]);
  const [staffSubmissions, setStaffSubmissions] = useState(0);
  const [staffFeedback, setStaffFeedback] = useState(null);
  const [staffIncorrectIndices, setStaffIncorrectIndices] = useState([]);
  const [staffPlayingNote, setStaffPlayingNote] = useState(null);
  const [staffPlayingNoteIdx, setStaffPlayingNoteIdx] = useState(null);
  const [staffIsPlayingSong, setStaffIsPlayingSong] = useState(false);
  const [showKeyboardLabels, setShowKeyboardLabels] = useState(true);
  const [freeScore, setFreeScore] = useState(0);

  const initializeStaffGame = () => {
    const randomSong = generateRandomStaffNotes(6);
    setStaffActiveSong(randomSong);
    setStaffActiveInputIdx(0);
    setStaffUserAnswers(Array(randomSong.notes.length).fill(""));
    setStaffSubmissions(0);
    setStaffFeedback(null);
    setStaffIncorrectIndices([]);
    setStaffPlayingNote(null);
    setStaffPlayingNoteIdx(null);
    setStaffIsPlayingSong(false);
  };

  useEffect(() => {
    initializeStaffGame();
  }, [isHw]);

  const handleStaffNoteInput = (noteName) => {
    if (staffIsPlayingSong) return;
    playPianoNote(noteName);

    if (staffActiveSong && staffActiveInputIdx >= 0 && staffActiveInputIdx < staffActiveSong.notes.length) {
      setStaffUserAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[staffActiveInputIdx] = noteName;
        return newAnswers;
      });

      setStaffActiveInputIdx((prev) => {
        const nextIdx = prev + 1;
        return nextIdx < staffActiveSong.notes.length ? nextIdx : prev;
      });
    }
  };

  const handleStaffTextboxClick = (idx) => {
    if (staffIsPlayingSong) return;
    setStaffActiveInputIdx(idx);
  };

  const playSongMelody = (notes) => {
    setStaffIsPlayingSong(true);
    setStaffPlayingNote(null);
    setStaffPlayingNoteIdx(null);
    notes.forEach((note, idx) => {
      setTimeout(() => {
        if (!note) return;
        playPianoNote(note);
        setStaffPlayingNote(note);
        setStaffPlayingNoteIdx(idx);
        
        setTimeout(() => {
          setStaffPlayingNote(null);
          setStaffPlayingNoteIdx(null);
        }, 300);

        if (idx === notes.length - 1) {
          setTimeout(() => {
            setStaffIsPlayingSong(false);
          }, 500);
        }
      }, idx * 450);
    });
  };

  const handleStaffSubmit = async () => {
    if (!staffActiveSong) return;

    const isCorrect = staffUserAnswers.every((ans, idx) =>
      isEnharmonicallyEquivalent(ans, staffActiveSong.notes[idx])
    );

    if (isCorrect) {
      setStaffFeedback({ type: "success", text: "Correct!" });
      playSongMelody(staffActiveSong.notes);

      if (isHw && hwActiveItem) {
        try {
          const res = await fetch("http://localhost:4000/api/homework/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: hwActiveItem.id,
              username: user.username
            })
          });
          const updated = await res.json();
          
          if (updated.completed) {
            setStaffFeedback({ type: "success", text: "Huzzah! Assignment Completed! 🎶" });
            setTimeout(() => {
              setHwActiveItem(null);
              setIsPlayingHW(false);
              fetchStudentData();
            }, 3500);
            return;
          } else {
            setHwCount(updated.progress);
            setTimeout(() => {
              initializeStaffGame();
            }, 4500);
          }
        } catch (err) {
          console.error("Error updating progress:", err);
        }
      } else {
        setFreeScore((s) => {
          const nextScore = s + 1;
          if (nextScore > staffHighScore) {
            setStaffHighScore(nextScore);
            localStorage.setItem(`piano_high_score_${user.username}_staff`, nextScore.toString());
          }
          return nextScore;
        });
        setTimeout(() => {
          initializeStaffGame();
        }, 4500);
      }
    } else {
      const incorrectIndices = [];
      staffUserAnswers.forEach((ans, idx) => {
        if (!isEnharmonicallyEquivalent(ans, staffActiveSong.notes[idx])) {
          incorrectIndices.push(idx);
        }
      });
      setStaffIncorrectIndices(incorrectIndices);
      setStaffFeedback({ type: "error", text: "Incorrect!" });

      playSongMelody(staffActiveSong.notes);

      setTimeout(() => {
        initializeStaffGame();
      }, 4500);
    }
  };

  if (!staffActiveSong) return null;
  const notes = staffActiveSong.notes;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 border-3 border-slate-800 mb-6 select-none shadow-[2px_2px_0px_#a7f3d0]">
        <button
          type="button"
          onClick={() => setStaffClef("treble")}
          className={`py-1.5 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            staffClef === "treble"
              ? "bg-amber-300 border-2 border-slate-800 text-slate-800 shadow-[1px_1px_0px_#1e293b]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Treble Clef
        </button>
        <button
          type="button"
          onClick={() => setStaffClef("bass")}
          className={`py-1.5 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
            staffClef === "bass"
              ? "bg-amber-300 border-2 border-slate-800 text-slate-800 shadow-[1px_1px_0px_#1e293b]"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Bass Clef
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0] relative flex flex-col items-center mb-6">
        <div className="w-full flex justify-between items-center mb-6 border-b-3 border-slate-100 pb-3 select-none">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-black text-emerald-600 uppercase tracking-widest leading-none">
              Staff Note Reader {isHw ? `(${hwCount} / ${hwActiveItem?.target} completed)` : ""}
            </span>
            {!isHw && (
              <div className="flex bg-amber-100 border-2 border-slate-800 px-3 py-0.5 rounded-full text-[10px] font-black text-slate-800 shadow-[1px_1px_0px_#1e293b] items-center gap-1 w-fit select-none">
                🏆 High Score: <span className="text-emerald-700 font-extrabold text-xs">{staffHighScore}</span>
                <span className="text-slate-400 mx-1">|</span>
                Score: <span className="text-slate-700 font-bold">{freeScore}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500">Show Keyboard Names:</span>
            <button
              type="button"
              onClick={() => setShowKeyboardLabels(!showKeyboardLabels)}
              className={`w-12 h-6 border-3 border-slate-800 rounded-full transition-colors relative cursor-pointer ${
                showKeyboardLabels ? "bg-emerald-300" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 bg-slate-800 rounded-full absolute top-0.5 transition-all ${
                  showKeyboardLabels ? "right-0.5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[160px] bg-white border-2 border-slate-300 rounded-xl overflow-hidden mb-6">
          {[48, 64, 80, 96, 112].map((bottomVal, idx) => (
            <div
              key={idx}
              style={{ bottom: `${bottomVal}px` }}
              className="absolute left-0 right-0 h-[1.5px] bg-black"
            />
          ))}

          <div
            style={{
              left: "12px",
              bottom: staffClef === "treble" ? "30px" : "42px",
              fontSize: staffClef === "treble" ? "98px" : "72px"
            }}
            className="absolute select-none text-black leading-none font-normal font-serif pointer-events-none"
          >
            {staffClef === "treble" ? "𝄞" : "𝄢"}
          </div>

          {notes.map((note, index) => {
            const step = staffClef === "treble" ? getTrebleStep(note) : getBassStep(note);
            const leftPercent = 25 + index * (65 / (notes.length - 1 || 1));
            const bottomVal = 48 + step * 8;

            return (
              <div key={index}>
                {staffClef === "treble" && step === -2 && (
                  <div
                    style={{
                      left: `calc(${leftPercent}% - 13px)`,
                      width: "26px",
                      bottom: `32px`
                    }}
                    className="absolute h-[1.5px] bg-black"
                  />
                )}

                <div
                  style={{
                    left: `calc(${leftPercent}% - 8px)`,
                    bottom: `${bottomVal - 8}px`
                  }}
                  className={`absolute w-[16px] h-[16px] rounded-full transition-all duration-150 ${
                    staffIsPlayingSong && staffPlayingNoteIdx === index
                      ? staffIncorrectIndices.includes(index)
                        ? "bg-red-500 scale-125 shadow-lg shadow-red-200"
                        : "bg-emerald-500 scale-125 shadow-lg shadow-emerald-200"
                      : staffIncorrectIndices.includes(index)
                      ? "bg-red-500 scale-110 shadow-md shadow-red-100"
                      : staffActiveInputIdx === index
                      ? "bg-amber-400 scale-110 shadow-md shadow-amber-100"
                      : "bg-black"
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="w-full h-14 relative mb-6">
          {notes.map((_, index) => {
            const leftPercent = 25 + index * (65 / (notes.length - 1 || 1));
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleStaffTextboxClick(index)}
                style={{
                  left: `calc(${leftPercent}% - 22px)`
                }}
                className={`absolute w-11 h-11 border-3 border-slate-800 rounded-xl font-black text-md transition-all shadow-[2px_2px_0px_#1e293b] flex items-center justify-center cursor-pointer hover:scale-[1.05] ${
                  staffActiveInputIdx === index
                    ? "bg-amber-300 text-slate-800"
                    : staffUserAnswers[index]
                    ? "bg-emerald-550 bg-emerald-50 text-slate-800"
                    : "bg-white text-slate-300"
                }`}
              >
                {staffUserAnswers[index] || "?"}
              </button>
            );
          })}
        </div>

        <div className="w-full flex flex-col items-center gap-3">
          {staffFeedback && (
            <div
              className={`w-full py-2.5 border-3 border-slate-800 rounded-xl text-xs font-black text-center shadow-[2px_2px_0px_#1e293b] ${
                staffFeedback.type === "success"
                  ? "bg-emerald-100 text-emerald-950"
                  : "bg-amber-100 text-amber-950"
              }`}
            >
              {staffFeedback.text}
            </div>
          )}

          <button
            type="button"
            disabled={staffIsPlayingSong}
            onClick={handleStaffSubmit}
            className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-md font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
          >
            Submit Answers
          </button>
        </div>
      </div>

      <div className="w-full mb-6">
        <div className="text-center font-black text-xs text-slate-600 mb-2 uppercase tracking-widest">
          {staffIsPlayingSong ? "Autoplaying Song Melody..." : "Click piano keys below to fill active textbox"}
        </div>
        <PianoKeyboard
          selectedNotes={
            staffIsPlayingSong && staffPlayingNote
              ? [staffPlayingNote]
              : staffSubmissions >= 2
              ? notes
              : []
          }
          onNoteClick={handleStaffNoteInput}
          isNoteMode={!showKeyboardLabels}
          compact={true}
          theme="emerald"
        />
      </div>
    </div>
  );
}
