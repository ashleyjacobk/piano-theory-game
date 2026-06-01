import React, { useState, useEffect } from "react";
import PianoKeyboard from "../common/PianoKeyboard";
import StaffReaderGame from "./StaffReaderGame";
import useTimedGame from "../../hooks/useTimedGame";
import { generateChordPrompt, generateFindNotePrompt, generateIntervalPrompt, generateScalePrompt, isSameChord } from "../../game/prompts";
import { isEnharmonicallyEquivalent } from "../../game/notes";
import { playPianoNote } from "../../utils/audio";
import { addFreePracticeScore } from "../../api/profileApi";

export default function ArcadeTab({
  user,
  staffHighScore,
  setStaffHighScore
}) {
  const [freeMode, setFreeMode] = useState("note"); // "note" | "chord" | "interval" | "scale" | "staff"
  const [isTimed, setIsTimed] = useState(true);

  // Timed arcade state
  const {
    timeLeft,
    gameActive,
    gameFinished,
    score: timedScore,
    setScore: setTimedScore,
    startGame,
    stopGame
  } = useTimedGame(30);

  // Untimed gameplay state
  const [freePrompt, setFreePrompt] = useState(null);
  const [freeSelectedNotes, setFreeSelectedNotes] = useState([]);
  const [freeFeedback, setFreeFeedback] = useState(null);
  const [freeScore, setFreeScore] = useState(0);

  // High Scores from localStorage
  const [noteHighScore, setNoteHighScore] = useState(0);
  const [chordHighScore, setChordHighScore] = useState(0);
  const [intervalHighScore, setIntervalHighScore] = useState(0);
  const [scaleHighScore, setScaleHighScore] = useState(0);

  // Load high scores
  useEffect(() => {
    if (user && user.username) {
      setNoteHighScore(parseInt(localStorage.getItem(`piano_high_score_${user.username}_note`) || "0", 10));
      setChordHighScore(parseInt(localStorage.getItem(`piano_high_score_${user.username}_chord`) || "0", 10));
      setIntervalHighScore(parseInt(localStorage.getItem(`piano_high_score_${user.username}_interval`) || "0", 10));
      setScaleHighScore(parseInt(localStorage.getItem(`piano_high_score_${user.username}_scale`) || "0", 10));
    }
  }, [user]);

  // Track timer end to save score to database!
  useEffect(() => {
    if (gameFinished && isTimed && freeMode === "note") {
      // Save timed score in background
      addFreePracticeScore({
        username: user.username,
        type: "note_timed",
        score: timedScore
      }).catch((err) => console.error("Error saving timed score:", err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFinished, isTimed]);

  // Mode/Timer swap cleanup
  useEffect(() => {
    stopGame();
    setFreeScore(0);
    setFreeSelectedNotes([]);
    setFreeFeedback(null);

    // Initialize prompt for active mode
    if (freeMode === "note") {
      setFreePrompt(generateFindNotePrompt());
    } else if (freeMode === "chord") {
      setFreePrompt(generateChordPrompt());
    } else if (freeMode === "interval") {
      setFreePrompt(generateIntervalPrompt());
    } else if (freeMode === "scale") {
      setFreePrompt(generateScalePrompt());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeMode, isTimed]);

  const handleFreeNoteClick = (note) => {
    if (freeMode === "note" && isTimed && !gameActive) return;
    playPianoNote(note);

    if (freeMode === "note" || freeMode === "interval") {
      setFreeSelectedNotes([note]);
    } else {
      if (freeSelectedNotes.includes(note)) {
        setFreeSelectedNotes((prev) => prev.filter((n) => n !== note));
      } else {
        setFreeSelectedNotes((prev) => [...prev, note]);
      }
    }
  };

  const handleFreeSubmit = () => {
    if (freeMode === "note" && isTimed && !gameActive) return;
    if (!freePrompt) return;

    let correct = false;
    if (freeMode === "chord" || freeMode === "scale") {
      correct = isSameChord(freeSelectedNotes, freePrompt.answer);
    } else {
      correct =
        freeSelectedNotes.length === 1 &&
        isEnharmonicallyEquivalent(freeSelectedNotes[0], freePrompt.answer);
    }

    if (correct) {
      setFreeFeedback("Correct!");
      
      // Update high scores and scores
      const activeScore = isTimed && freeMode === "note" ? timedScore : freeScore;
      const nextScore = activeScore + 1;

      if (isTimed && freeMode === "note") {
        setTimedScore(nextScore);
        if (nextScore > noteHighScore) {
          setNoteHighScore(nextScore);
          localStorage.setItem(`piano_high_score_${user.username}_note`, nextScore.toString());
        }
      } else {
        setFreeScore(nextScore);
        
        if (freeMode === "note") {
          if (nextScore > noteHighScore) {
            setNoteHighScore(nextScore);
            localStorage.setItem(`piano_high_score_${user.username}_note`, nextScore.toString());
          }
        } else if (freeMode === "chord") {
          if (nextScore > chordHighScore) {
            setChordHighScore(nextScore);
            localStorage.setItem(`piano_high_score_${user.username}_chord`, nextScore.toString());
          }
        } else if (freeMode === "interval") {
          if (nextScore > intervalHighScore) {
            setIntervalHighScore(nextScore);
            localStorage.setItem(`piano_high_score_${user.username}_interval`, nextScore.toString());
          }
        } else if (freeMode === "scale") {
          if (nextScore > scaleHighScore) {
            setScaleHighScore(nextScore);
            localStorage.setItem(`piano_high_score_${user.username}_scale`, nextScore.toString());
          }
        }

        // Save untimed score to DB in background
        addFreePracticeScore({
          username: user.username,
          type: freeMode,
          score: nextScore
        }).catch((err) => console.error("Error saving score to database:", err));
      }

      // Next Question
      const lastAnswer = freePrompt.answer;
      const lastRoot = freePrompt.root;
      setTimeout(() => {
        let nextPrompt;
        if (freeMode === "note") {
          nextPrompt = generateFindNotePrompt(lastAnswer);
        } else if (freeMode === "chord") {
          nextPrompt = generateChordPrompt(lastRoot);
        } else if (freeMode === "interval") {
          nextPrompt = generateIntervalPrompt(lastRoot);
        } else if (freeMode === "scale") {
          nextPrompt = generateScalePrompt(lastRoot);
        }
        setFreePrompt(nextPrompt);
        setFreeSelectedNotes([]);
        setFreeFeedback(null);
      }, 800);
    } else {
      setFreeFeedback("Try again!");
      setFreeSelectedNotes([]);
      setTimeout(() => setFreeFeedback(null), 1000);
    }
  };

  return (
    <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0] max-w-2xl mx-auto flex flex-col items-center">
      {/* Free Mode Switcher */}
      <div className="grid grid-cols-5 gap-2 mb-6 w-full select-none">
        {[
          { id: "note", label: "Note" },
          { id: "chord", label: "Chord" },
          { id: "interval", label: "Interval" },
          { id: "scale", label: "Scale" },
          { id: "staff", label: "Staff" }
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setFreeMode(mode.id)}
            className={`py-2 border-3 border-slate-800 rounded-2xl text-[10px] font-black shadow-[3px_3px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.02] active:translate-y-0.5 ${
              freeMode === mode.id
                ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#1e293b]"
                : "bg-white text-slate-500 hover:bg-emerald-50"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {freeMode === "note" && (
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1.5 border-2 border-slate-800 mb-6 w-full max-w-xs justify-center shadow-[2px_2px_0px_#a7f3d0] select-none">
          <button
            type="button"
            onClick={() => setIsTimed(true)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              isTimed
                ? "bg-emerald-300 border border-slate-800 font-extrabold text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Timed Speed Run
          </button>
          <button
            type="button"
            onClick={() => setIsTimed(false)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              !isTimed
                ? "bg-emerald-300 border border-slate-800 font-extrabold text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Untimed Practice
          </button>
        </div>
      )}

      {freeMode === "note" && (
        <div className="mb-6 bg-amber-100 border-3 border-slate-800 px-5 py-1.5 rounded-full text-xs font-black text-slate-800 shadow-[2px_2px_0px_#1e293b] select-none flex items-center gap-1.5">
          🏆 Note Matcher High Score: <span className="text-emerald-700 font-extrabold text-sm">{noteHighScore}</span>
        </div>
      )}

      {freeMode === "note" && isTimed ? (
        !gameActive ? (
          <div className="w-full text-center space-y-6">
            {gameFinished ? (
              <div className="border-4 border-slate-800 rounded-[2rem] p-6 bg-emerald-50/10 shadow-[4px_4px_0px_#fef08a] text-center max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-wide">
                  Time's Up!
                </h3>
                <p className="font-extrabold text-slate-600 text-lg">
                  You successfully matched <span className="font-black text-emerald-500 text-2xl">{timedScore}</span> notes in 30 seconds!
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={startGame}
                    className="w-full py-3.5 bg-white hover:bg-emerald-50 text-slate-800 border-3 border-slate-800 rounded-xl text-md font-black shadow-[3px_3px_0px_#fef08a] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    Start New Speed Run
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-4 border-slate-800 rounded-[2rem] p-6 bg-emerald-50/10 shadow-[4px_4px_0px_#fef08a] text-center max-w-md mx-auto space-y-4">
                <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-wide">
                  Speed Matcher
                </h3>
                <p className="font-bold text-slate-600 text-sm leading-relaxed">
                  Match as many notes correctly as you can before the 30-second timer runs out. Are you ready?
                </p>
                <button
                  onClick={startGame}
                  className="w-full py-4 bg-emerald-300 hover:bg-emerald-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#fef08a] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                >
                  Start 30s Game
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-full mb-6 bg-emerald-50/20 border-3 border-slate-800 p-4 rounded-[1.5rem] shadow-[4px_4px_0px_#fef08a] flex flex-col gap-2 select-none">
              <div className="flex justify-between items-center font-black text-slate-700 text-sm">
                <span>
                  Time Remaining:{" "}
                  <span className={timeLeft <= 10 ? "text-red-500 font-extrabold" : "text-emerald-600"}>
                    {timeLeft} seconds
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-bold">🏆 High Score: {noteHighScore}</span>
                  <span>Score: {timedScore}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 border-2 border-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 10 ? "bg-red-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            {freePrompt && (
              <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short select-none">
                {freePrompt.question}
              </div>
            )}

            <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse select-none">
              {freeFeedback}
            </div>

            <PianoKeyboard
              selectedNotes={freeSelectedNotes}
              onNoteClick={handleFreeNoteClick}
              isNoteMode={true}
              theme="emerald"
            />

            <div className="flex flex-col items-center w-full mt-6">
              <button
                onClick={handleFreeSubmit}
                className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
              >
                Submit Note
              </button>
            </div>
          </div>
        )
      ) : freeMode === "staff" ? (
        <StaffReaderGame
          user={user}
          isHw={false}
          staffHighScore={staffHighScore}
          setStaffHighScore={setStaffHighScore}
        />
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="w-full mb-6 bg-slate-50 border-3 border-slate-800 p-4 rounded-[1.5rem] shadow-[4px_4px_0px_#1e293b] flex flex-col items-center gap-2 select-none">
            <div className="flex bg-amber-100 border-2 border-slate-800 px-4 py-1 rounded-full text-xs font-black text-slate-800 shadow-[1px_1px_0px_#1e293b] items-center gap-1.5">
              🏆 High Score:{" "}
              <span className="text-emerald-700 font-extrabold text-sm">
                {freeMode === "note"
                  ? noteHighScore
                  : freeMode === "chord"
                  ? chordHighScore
                  : freeMode === "interval"
                  ? intervalHighScore
                  : scaleHighScore}
              </span>
            </div>
            <div className="text-slate-700 text-sm font-black mt-1">
              Current Score: <span className="text-emerald-600 text-md">{freeScore}</span>
            </div>
          </div>

          {freePrompt && (
            <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short select-none">
              {freePrompt.question}
            </div>
          )}

          <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse select-none">
            {freeFeedback}
          </div>

          <PianoKeyboard
            selectedNotes={freeSelectedNotes}
            onNoteClick={handleFreeNoteClick}
            isNoteMode={freeMode === "note"}
            theme="emerald"
          />

          <div className="flex flex-col items-center w-full mt-6">
            <button
              onClick={handleFreeSubmit}
              className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
            >
              {freeMode === "chord"
                ? "Submit Chord"
                : freeMode === "interval"
                ? "Submit Note"
                : freeMode === "scale"
                ? "Submit Scale"
                : "Submit Note"}
            </button>
            {(freeMode === "chord" || freeMode === "scale") && (
              <div className="mt-4 font-bold text-xs bg-emerald-50/20 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 shadow-[1px_1px_0px_#fef08a] select-none">
                Selected: {freeSelectedNotes.join(" ") || "None"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
