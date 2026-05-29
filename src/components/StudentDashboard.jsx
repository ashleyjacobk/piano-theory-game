import React, { useState, useEffect } from "react";
import { PIANO_KEYS } from "../data/pianoLayout";
import { playPianoNote } from "../utils/audio";
import { generateChordPrompt, generateFindNotePrompt, isSameChord } from "../game/prompts";

export default function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("homework"); // "homework" | "free" | "logs" | "videos" | "profile"
  
  // Roster / Data stats
  const [homeworkList, setHomeworkList] = useState([]);
  const [practiceLogs, setPracticeLogs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [archivedSongs, setArchivedSongs] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [freePracticeHistory, setFreePracticeHistory] = useState([]);

  // Log practice states
  const [logMinutes, setLogMinutes] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [logMessage, setLogMessage] = useState(null);
  const [logHwLink, setLogHwLink] = useState(""); // homeworkId of linked practice assignment
  const [logSongLink, setLogSongLink] = useState(""); // songName linked
  const [logCustomSongName, setLogCustomSongName] = useState(""); // custom songName typed

  // Active Homework Game state
  const [hwActiveItem, setHwActiveItem] = useState(null);
  const [hwSubTab, setHwSubTab] = useState("upcoming"); // "upcoming" | "completed" | "past"
  const [isPlayingHW, setIsPlayingHW] = useState(false);
  const [hwSelectedNotes, setHwSelectedNotes] = useState([]);
  const [hwPrompt, setHwPrompt] = useState(null);
  const [hwFeedback, setHwFeedback] = useState(null);
  const [hwCount, setHwCount] = useState(0);

  // Free Practice Game state
  const [freeMode, setFreeMode] = useState("note"); // "note" | "chord"
  const [freePrompt, setFreePrompt] = useState(null);
  const [freeSelectedNotes, setFreeSelectedNotes] = useState([]);
  const [freeFeedback, setFreeFeedback] = useState(null);
  const [freeScore, setFreeScore] = useState(0);
  const [savingFreeScore, setSavingFreeScore] = useState(false);

  // Timed game states
  const [isTimed, setIsTimed] = useState(true);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameFinished, setGameFinished] = useState(false);

  // Song browsing states
  const [selectedSong, setSelectedSong] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // High Scores & Collapsible Video Comments
  const [showAllScores, setShowAllScores] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // { [videoId]: boolean }
  const [commentsData, setCommentsData] = useState({}); // { [videoId]: Array }
  const [commentInputs, setCommentInputs] = useState({}); // { [videoId]: String }
  const [commentsLoading, setCommentsLoading] = useState({}); // { [videoId]: boolean }

  const fetchStudentData = async () => {
    try {
      // Profile Details
      const resProfile = await fetch(`http://localhost:4000/api/student-profile/${user.username}`);
      const dataProfile = await resProfile.json();
      setProfileData(dataProfile);

      // Free Practice saved scores (to show in Profile)
      const resFreePractice = await fetch(`http://localhost:4000/api/free-practice/${user.username}`);
      const dataFreePractice = await resFreePractice.json();
      setFreePracticeHistory(dataFreePractice);

      // Homework
      const resHw = await fetch(`http://localhost:4000/api/homework/${user.username}`);
      const dataHw = await resHw.json();
      setHomeworkList(dataHw);
      if (!isPlayingHW) {
        const active = dataHw.find(h => !h.completed);
        setHwActiveItem(active || null);
      }

      // Practice Logs
      const resLogs = await fetch(`http://localhost:4000/api/practice-logs/${user.username}`);
      const dataLogs = await resLogs.json();
      setPracticeLogs(dataLogs);

      // Videos (scoped to student)
      const resVideos = await fetch(`http://localhost:4000/api/videos?username=${user.username}`);
      const dataVideos = await resVideos.json();
      setVideos(dataVideos);

      // Fetch archived songs list
      const resArchive = await fetch("http://localhost:4000/api/songs/archive");
      const dataArchive = await resArchive.json();
      setArchivedSongs(dataArchive);
    } catch (err) {
      console.error("Error fetching student data:", err);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [activeTab]);

  // Initialize Game Prompts
  useEffect(() => {
    if (isPlayingHW && hwActiveItem) {
      setHwCount(hwActiveItem.progress);
      setHwPrompt(hwActiveItem.type === "note" ? generateFindNotePrompt() : generateChordPrompt());
      setHwSelectedNotes([]);
      setHwFeedback(null);
    }
  }, [isPlayingHW, hwActiveItem]);

  useEffect(() => {
    setFreePrompt(freeMode === "note" ? generateFindNotePrompt() : generateChordPrompt());
    setFreeSelectedNotes([]);
    setFreeFeedback(null);
  }, [freeMode]);

  // Countdown timer interval logic for 30s Note Game
  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameActive(false);
            setGameFinished(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameActive, timeLeft]);

  // Tab/mode/timed change cleanup to prevent background timer leaks and reset states
  useEffect(() => {
    setGameActive(false);
    setGameFinished(false);
    setTimeLeft(30);
    setFreeScore(0);
    setFreeSelectedNotes([]);
    setFreeFeedback(null);
  }, [activeTab, freeMode, isTimed]);

  // ==========================================
  // HOMEWORK GAME WORKFLOW
  // ==========================================
  const handleHwNoteClick = (note) => {
    playPianoNote(note);
    
    if (hwActiveItem.type === "note") {
      // NOTE mode: allow only 1 selection
      setHwSelectedNotes([note]);
    } else {
      // CHORD mode: toggle selections
      if (hwSelectedNotes.includes(note)) {
        setHwSelectedNotes(prev => prev.filter(n => n !== note));
      } else {
        setHwSelectedNotes(prev => [...prev, note]);
      }
    }
  };

  const handleHwSubmit = async () => {
    if (!hwPrompt || !hwActiveItem) return;

    let correct = false;
    if (hwActiveItem.type === "chord") {
      correct = isSameChord(hwSelectedNotes, hwPrompt.answer);
    } else {
      correct = hwSelectedNotes.length === 1 && hwSelectedNotes[0] === hwPrompt.answer;
    }

    if (correct) {
      setHwFeedback("Correct!");
      
      // Update backend progress
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
        
        setHwCount(updated.progress);
        
        if (updated.completed) {
          setHwFeedback("Huzzah! Assignment Completed!");
          setHwActiveItem(null);
          setIsPlayingHW(false);
          fetchStudentData(); // Refresh roster details
          return;
        }
      } catch (err) {
        console.error("Error updating progress:", err);
      }
      
      // Next Question (prevent duplicates!)
      const lastAnswer = hwPrompt.answer;
      const lastRoot = hwPrompt.root;
      setTimeout(() => {
        setHwPrompt(hwActiveItem.type === "note" 
          ? generateFindNotePrompt(lastAnswer) 
          : generateChordPrompt(lastRoot)
        );
        setHwSelectedNotes([]);
        setHwFeedback(null);
      }, 800);

    } else {
      setHwFeedback("Try again!");
      // Auto-clear notes on incorrect guess!
      setHwSelectedNotes([]);
      setTimeout(() => setHwFeedback(null), 1000);
    }
  };

  // ==========================================
  // FREE PRACTICE GAME WORKFLOW
  // ==========================================
  const handleFreeNoteClick = (note) => {
    if (freeMode === "note" && isTimed && !gameActive) return;
    playPianoNote(note);

    if (freeMode === "note") {
      // NOTE mode: allow only 1 selection
      setFreeSelectedNotes([note]);
    } else {
      // CHORD mode: toggle selections
      if (freeSelectedNotes.includes(note)) {
        setFreeSelectedNotes(prev => prev.filter(n => n !== note));
      } else {
        setFreeSelectedNotes(prev => [...prev, note]);
      }
    }
  };

  const handleFreeSubmit = () => {
    if (freeMode === "note" && isTimed && !gameActive) return;
    if (!freePrompt) return;

    let correct = false;
    if (freeMode === "chord") {
      correct = isSameChord(freeSelectedNotes, freePrompt.answer);
    } else {
      correct = freeSelectedNotes.length === 1 && freeSelectedNotes[0] === freePrompt.answer;
    }

    if (correct) {
      setFreeFeedback("Correct!");
      setFreeScore(s => s + 1);
      
      // Next Question (prevent duplicates!)
      const lastAnswer = freePrompt.answer;
      const lastRoot = freePrompt.root;
      setTimeout(() => {
        setFreePrompt(freeMode === "note" 
          ? generateFindNotePrompt(lastAnswer) 
          : generateChordPrompt(lastRoot)
        );
        setFreeSelectedNotes([]);
        setFreeFeedback(null);
      }, 800);
    } else {
      setFreeFeedback("Try again!");
      // Auto-clear notes on incorrect guess!
      setFreeSelectedNotes([]);
      setTimeout(() => setFreeFeedback(null), 1000);
    }
  };

  const saveFreePracticeScore = async () => {
    if (freeMode !== "note" || !isTimed || freeScore === 0) return;
    setSavingFreeScore(true);
    try {
      const res = await fetch("http://localhost:4000/api/free-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          type: freeMode,
          score: freeScore
        })
      });

      if (res.ok) {
        alert(`Saved score of ${freeScore} to your profile!`);
        setGameFinished(false);
        setFreeScore(0);
        fetchStudentData(); // Refresh history log
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFreeScore(false);
    }
  };

  const handleHwDropdownChange = (e) => {
    const hwId = e.target.value;
    setLogHwLink(hwId);
    if (hwId) {
      const selectedHw = homeworkList.find(h => h.id === parseInt(hwId));
      if (selectedHw && selectedHw.songName) {
        const availableSongs = Array.from(new Set(videos.map(v => v.songName))).filter(Boolean);
        if (availableSongs.includes(selectedHw.songName)) {
          setLogSongLink(selectedHw.songName);
        } else {
          setLogSongLink("custom");
          setLogCustomSongName(selectedHw.songName);
        }
      }
    }
  };

  // ==========================================
  // PRACTICE MANUAL LOGGER
  // ==========================================
  const handleLogPractice = async (e) => {
    e.preventDefault();
    setLogLoading(true);
    setLogMessage(null);

    let finalSongName = null;
    if (logSongLink) {
      finalSongName = logSongLink === "custom" ? logCustomSongName.trim() : logSongLink;
    }

    try {
      const res = await fetch("http://localhost:4000/api/practice-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          minutes: parseInt(logMinutes),
          notes: logNotes.trim(),
          homeworkId: logHwLink || null,
          songName: finalSongName
        })
      });

      if (!res.ok) throw new Error("Could not log practice.");

      setLogMessage({ type: "success", text: "Session logged successfully!" });
      setLogMinutes("");
      setLogNotes("");
      setLogHwLink("");
      setLogSongLink("");
      setLogCustomSongName("");
      fetchStudentData(); // Refresh feed
    } catch (err) {
      setLogMessage({ type: "error", text: err.message });
    } finally {
      setLogLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("WARNING: Are you absolutely sure you want to permanently delete your account? This will erase all of your homework, practice logs, high-scores, and video links forever. This action is irreversible!");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:4000/api/users/${user.username}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Your student account has been successfully deleted.");
        onLogout(true); // Bypass confirmation modal
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to delete account");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while attempting to delete your account.");
    }
  };

  // Group videos by song name
  const groupedVideos = videos.reduce((acc, video) => {
    if (!acc[video.songName]) {
      acc[video.songName] = [];
    }
    acc[video.songName].push(video);
    return acc;
  }, {});

  const allSongNames = Object.keys(groupedVideos);
  const activeSongs = allSongNames.filter(name => !archivedSongs.includes(name));
  const archivedSongsList = allSongNames.filter(name => archivedSongs.includes(name));

  // Set default selected song if none is selected or if current selection is invalid for the view
  useEffect(() => {
    if (showArchived) {
      if (!archivedSongsList.includes(selectedSong)) {
        setSelectedSong(archivedSongsList.length > 0 ? archivedSongsList[0] : "");
      }
    } else {
      if (!activeSongs.includes(selectedSong)) {
        setSelectedSong(activeSongs.length > 0 ? activeSongs[0] : "");
      }
    }
  }, [showArchived, archivedSongs, videos, selectedSong]);

  // Video Comments Handlers
  const toggleComments = async (videoId) => {
    const isExpanded = !expandedComments[videoId];
    setExpandedComments(prev => ({ ...prev, [videoId]: isExpanded }));
    
    if (isExpanded) {
      setCommentsLoading(prev => ({ ...prev, [videoId]: true }));
      try {
        const res = await fetch(`http://localhost:4000/api/videos/${videoId}/comments`);
        const data = await res.json();
        setCommentsData(prev => ({ ...prev, [videoId]: data }));
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setCommentsLoading(prev => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const handleCommentInputChange = (videoId, value) => {
    setCommentInputs(prev => ({ ...prev, [videoId]: value }));
  };

  const submitComment = async (videoId) => {
    const text = commentInputs[videoId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`http://localhost:4000/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          name: user.name,
          text: text.trim()
        })
      });

      if (res.ok) {
        const newComment = await res.json();
        setCommentsData(prev => ({
          ...prev,
          [videoId]: [...(prev[videoId] || []), newComment]
        }));
        setCommentInputs(prev => ({ ...prev, [videoId]: "" }));
        
        // Increment count locally on the video object
        setVideos(prev =>
          prev.map(v =>
            v.id === videoId ? { ...v, commentsCount: (v.commentsCount || 0) + 1 } : v
          )
        );
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  const renderPianoKeyboard = (selected, onNoteClick, isNoteMode) => {
    const isSelected = (note) => selected.includes(note);
    return (
      <div className="flex justify-center p-6 bg-emerald-100 rounded-[2rem] border-4 border-slate-800 shadow-[4px_4px_0px_#fef08a] overflow-x-auto max-w-full select-none">
        <div className="flex relative">
          {PIANO_KEYS.map((key, index) => {
            if (key.type === "white") {
              const nextKey = PIANO_KEYS[index + 1];
              const hasBlackKey = nextKey && nextKey.type === "black";

              return (
                <div key={key.note} className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onNoteClick(key.note)}
                    className={`w-11 h-32 border-3 border-slate-800 font-black flex items-end justify-center pb-3 rounded-b-lg transition-all active:translate-y-0.5 hover:scale-[1.01] cursor-pointer ${
                      isSelected(key.note) ? "bg-amber-300 text-slate-800 shadow-inner" : "bg-white text-slate-800"
                    }`}
                  >
                    {isNoteMode ? "" : key.note}
                  </button>
                  {hasBlackKey && (
                    <button
                      type="button"
                      onClick={() => onNoteClick(nextKey.note)}
                      className={`absolute top-0 right-0 translate-x-1/2 w-7 h-20 font-black flex items-end justify-center pb-2 rounded-b-md z-10 transition-all active:translate-y-0.5 hover:scale-[1.01] border-3 border-slate-800 text-[10px] cursor-pointer ${
                        isSelected(nextKey.note) ? "bg-amber-300 text-slate-800 shadow-inner" : "bg-slate-900 text-white"
                      }`}
                    >
                      {isNoteMode ? "" : nextKey.note}
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  const isExpired = (dueDateStr) => {
    if (!dueDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr + "T23:59:59");
    return due < today;
  };

  const uncompletedHWCount = homeworkList.filter(h => !h.completed).length;

  return (
    <div className="w-full max-w-5xl flex flex-col p-4 font-mono text-slate-800">
      {/* Student Hub Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white border-4 border-slate-800 rounded-[2rem] p-6 shadow-[6px_6px_0px_#a7f3d0] mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            Student Academy
          </h1>
          <p className="font-bold text-slate-500 mt-1 text-sm">Welcome back, superstar {user.name}! Let's learn!</p>
        </div>
        <button
          onClick={() => onLogout()}
          className="px-5 py-2.5 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-md font-black shadow-[3px_3px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.03] transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Tabs Control */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveTab("homework")}
          className={`px-5 py-3 border-3 border-slate-800 rounded-2xl text-base font-black shadow-[4px_4px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${
            activeTab === "homework"
              ? "bg-emerald-300 text-slate-800"
              : "bg-white text-slate-500 hover:bg-emerald-50"
          }`}
        >
          Homework {uncompletedHWCount > 0 && <span className="bg-red-500 border-2 border-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse ml-1">{uncompletedHWCount}</span>}
        </button>

        <button
          onClick={() => setActiveTab("free")}
          className={`px-5 py-3 border-3 border-slate-800 rounded-2xl text-base font-black shadow-[4px_4px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${
            activeTab === "free"
              ? "bg-emerald-300 text-slate-800"
              : "bg-white text-slate-500 hover:bg-emerald-50"
          }`}
        >
          Free Practice
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-5 py-3 border-3 border-slate-800 rounded-2xl text-base font-black shadow-[4px_4px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${
            activeTab === "logs"
              ? "bg-emerald-300 text-slate-800"
              : "bg-white text-slate-500 hover:bg-emerald-50"
          }`}
        >
          Log Practice
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`px-5 py-3 border-3 border-slate-800 rounded-2xl text-base font-black shadow-[4px_4px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${
            activeTab === "videos"
              ? "bg-emerald-300 text-slate-800"
              : "bg-white text-slate-500 hover:bg-emerald-50"
          }`}
        >
          Video Lessons
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-3 border-3 border-slate-800 rounded-2xl text-base font-black shadow-[4px_4px_0px_#a7f3d0] transition active:translate-y-0.5 hover:scale-[1.02] cursor-pointer ${
            activeTab === "profile"
              ? "bg-emerald-300 text-slate-800"
              : "bg-white text-slate-500 hover:bg-emerald-50"
          }`}
        >
          My Profile
        </button>
      </div>

      {/* Tab Contents */}
      <div className="w-full">
        
        {/* TAB 1: HOMEWORK ASSIGNED */}
        {activeTab === "homework" && (
          <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0] max-w-2xl mx-auto flex flex-col items-center">
            {!isPlayingHW ? (() => {
              const upcomingHW = homeworkList.filter(h => !h.completed && !isExpired(h.dueDate));
              const completedHW = homeworkList.filter(h => h.completed);
              const pastHW = homeworkList.filter(h => !h.completed && isExpired(h.dueDate));
              
              let displayedHWList = [];
              if (hwSubTab === "upcoming") displayedHWList = upcomingHW;
              else if (hwSubTab === "completed") displayedHWList = completedHW;
              else if (hwSubTab === "past") displayedHWList = pastHW;

              return (
                <div className="w-full text-center space-y-6">
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                    Your Assignments
                  </h2>

                  {/* Sub-tabs menu */}
                  <div className="flex gap-2.5 mb-6 w-full justify-center">
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
                                  ? "Note Match" 
                                  : hw.type === "chord" 
                                  ? "Chord Build" 
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
              );
            })() : (
              /* LIVE HOMEWORK PLAY ZONE */
              <div className="w-full flex flex-col items-center">
                <div className="w-full flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-6">
                  <h3 className="font-black text-lg text-emerald-600">Homework: {hwActiveItem.type === "note" ? "Note Match" : "Chord Build"}</h3>
                  <button
                    onClick={() => { setIsPlayingHW(false); fetchStudentData(); }}
                    className="px-3.5 py-1.5 bg-amber-200 hover:bg-amber-100 border-2 border-slate-800 text-slate-800 rounded-xl font-black text-xs shadow-[2px_2px_0px_#a7f3d0] cursor-pointer hover:scale-[1.03] transition-all active:translate-y-0.5"
                  >
                    Quit Game
                  </button>
                </div>

                {/* Score badge & target */}
                <div className="bg-yellow-100 border-2 border-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-[2px_2px_0px_#a7f3d0] mb-4">
                  Progress: {hwCount} / {hwActiveItem.target} Correct
                </div>

                {/* Prompt */}
                {hwPrompt && (
                  <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short">
                    {hwPrompt.question}
                  </div>
                )}

                {/* Feedback */}
                <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse">
                  {hwFeedback}
                </div>

                {/* Piano - Hide labels in Note Mode */}
                {renderPianoKeyboard(hwSelectedNotes, handleHwNoteClick, hwActiveItem.type === "note")}

                {/* Submit & selections */}
                <div className="flex flex-col items-center w-full mt-6">
                  <button
                    onClick={handleHwSubmit}
                    className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    Submit Note
                  </button>
                  {hwActiveItem.type === "chord" && (
                    <div className="mt-4 font-bold text-xs bg-emerald-50/20 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 shadow-[1px_1px_0px_#fef08a]">
                      Selected: {hwSelectedNotes.join(" ") || "None"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FREE PRACTICE */}
        {activeTab === "free" && (
          <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0] max-w-2xl mx-auto flex flex-col items-center">
            {/* Free Mode Switcher */}
            <div className="flex gap-4 mb-6 w-full">
              <button
                onClick={() => { setFreeMode("note"); }}
                className={`flex-1 py-3 border-3 border-slate-800 rounded-2xl font-black shadow-[3px_3px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.02] active:translate-y-0.5 ${
                  freeMode === "note" ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]" : "bg-white text-slate-500 hover:bg-emerald-50"
                }`}
              >
                Note Matcher
              </button>
              <button
                onClick={() => { setFreeMode("chord"); }}
                className={`flex-1 py-3 border-3 border-slate-800 rounded-2xl font-black shadow-[3px_3px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.02] active:translate-y-0.5 ${
                  freeMode === "chord" ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]" : "bg-white text-slate-500 hover:bg-emerald-50"
                }`}
              >
                Chord Builder
              </button>
            </div>

            {/* Note Matcher Speed Options */}
            {freeMode === "note" && (
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1.5 border-2 border-slate-800 mb-6 w-full max-w-xs justify-center shadow-[2px_2px_0px_#a7f3d0] select-none">
                <button
                  type="button"
                  onClick={() => setIsTimed(true)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                    isTimed ? "bg-emerald-300 border border-slate-800 font-extrabold text-slate-800" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Timed Speed Run
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimed(false)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                    !isTimed ? "bg-emerald-300 border border-slate-800 font-extrabold text-slate-800" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Untimed Practice
                </button>
              </div>
            )}

            {/* Timed Mode Layout panels */}
            {freeMode === "note" && isTimed ? (
              !gameActive ? (
                // 1. TIMED GAME OVER SCREEN OR NOT STARTED
                <div className="w-full text-center space-y-6">
                  {gameFinished ? (
                    <div className="border-4 border-slate-800 rounded-[2rem] p-6 bg-emerald-50/10 shadow-[4px_4px_0px_#fef08a] text-center max-w-md mx-auto space-y-4">
                      <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-wide">
                        Time's Up!
                      </h3>
                      <p className="font-extrabold text-slate-600 text-lg">
                        You successfully matched <span className="font-black text-emerald-500 text-2xl">{freeScore}</span> notes in 30 seconds!
                      </p>
                      
                      <div className="flex flex-col gap-3 pt-2">
                        <button
                          onClick={saveFreePracticeScore}
                          disabled={freeScore === 0 || savingFreeScore}
                          className="w-full py-3.5 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-xl text-md font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer disabled:bg-emerald-50/50"
                        >
                          {savingFreeScore ? "Saving Score..." : "Save Practice Score"}
                        </button>
                        <button
                          onClick={() => {
                            setFreeScore(0);
                            setGameFinished(false);
                            setGameActive(true);
                            setTimeLeft(30);
                            setFreePrompt(generateFindNotePrompt());
                            setFreeSelectedNotes([]);
                          }}
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
                        onClick={() => {
                          setFreeScore(0);
                          setGameActive(true);
                          setTimeLeft(30);
                          setFreePrompt(generateFindNotePrompt());
                          setFreeSelectedNotes([]);
                        }}
                        className="w-full py-4 bg-emerald-300 hover:bg-emerald-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#fef08a] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                      >
                        Start 30s Game
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // 2. TIMED ACTIVE GAME SCREEN
                <div className="w-full flex flex-col items-center">
                  {/* Timer Countdown Bar HUD */}
                  <div className="w-full mb-6 bg-emerald-50/20 border-3 border-slate-800 p-4 rounded-[1.5rem] shadow-[4px_4px_0px_#fef08a] flex flex-col gap-2 select-none">
                    <div className="flex justify-between items-center font-black text-slate-700 text-sm">
                      <span>Time Remaining: <span className={timeLeft <= 10 ? "text-red-500 font-extrabold" : "text-emerald-600"}>{timeLeft} seconds</span></span>
                      <span>Score: {freeScore}</span>
                    </div>
                    {/* Progress countdown bar */}
                    <div className="w-full bg-slate-100 border-2 border-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          timeLeft <= 10 ? "bg-red-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Prompt */}
                  {freePrompt && (
                    <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short">
                      {freePrompt.question}
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse">
                    {freeFeedback}
                  </div>

                  {/* Piano - Hide letters in Note Matcher Mode */}
                  {renderPianoKeyboard(freeSelectedNotes, handleFreeNoteClick, true)}

                  {/* Submit Note Button */}
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
            ) : (
              // 3. UNTIMED MODE OR CHORD BUILDER LAYOUT
              <div className="w-full flex flex-col items-center">
                {/* Mode description notification block */}
                <div className="w-full mb-6 bg-slate-50 border-3 border-slate-800 p-4 rounded-[1.5rem] shadow-[4px_4px_0px_#slate-800] text-center font-bold text-xs select-none">
                  {freeMode === "note" ? (
                    <span className="text-slate-500">Playing in Untimed Mode. Score saving is disabled.</span>
                  ) : (
                    <span className="text-slate-500">Chord Builder Practice. Score saving is disabled.</span>
                  )}
                  <div className="mt-1 text-slate-700 text-sm">Score: {freeScore}</div>
                </div>

                {/* Prompt */}
                {freePrompt && (
                  <div className="bg-sky-200 text-sky-950 border-4 border-slate-800 rounded-[1.5rem] px-6 py-3 text-2xl font-black shadow-[4px_4px_0px_#a7f3d0] mb-4 text-center max-w-md w-full animate-bounce-short">
                    {freePrompt.question}
                  </div>
                )}

                {/* Feedback */}
                <div className="h-8 text-xl font-black mb-4 text-emerald-600 animate-pulse">
                  {freeFeedback}
                </div>

                {/* Piano - Hide letters in Note Matcher Mode */}
                {renderPianoKeyboard(freeSelectedNotes, handleFreeNoteClick, freeMode === "note")}

                {/* Submit Note Button */}
                <div className="flex flex-col items-center w-full mt-6">
                  <button
                    onClick={handleFreeSubmit}
                    className="px-10 py-3 bg-amber-300 hover:bg-amber-200 text-slate-800 border-3 border-slate-800 rounded-2xl text-xl font-black shadow-[3px_3px_0px_#a7f3d0] hover:scale-[1.02] active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    {freeMode === "note" ? "Submit Note" : "Submit Chord"}
                  </button>
                  {freeMode === "chord" && (
                    <div className="mt-4 font-bold text-xs bg-emerald-50/20 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-slate-700 shadow-[1px_1px_0px_#fef08a]">
                      Selected: {freeSelectedNotes.join(" ") || "None"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOG PRACTICE */}
        {activeTab === "logs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0] h-fit">
              <h2 className="text-xl font-black text-emerald-600 mb-4 border-b-3 border-slate-100 pb-2">
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
                  <label className="block text-xs font-black text-slate-600 mb-1">Practice Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="480"
                    required
                    placeholder="e.g. 45"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(e.target.value)}
                    className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a]"
                  />
                </div>

                {homeworkList.filter(h => !h.completed).length > 0 && (
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">Link to Homework Assignment</label>
                    <select
                      value={logHwLink}
                      onChange={handleHwDropdownChange}
                      className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a] cursor-pointer"
                    >
                      <option value="">-- General Practice (No Assignment) --</option>
                      {homeworkList.filter(h => !h.completed).map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.type === "practice"
                            ? `Practice: "${h.songName || "Assigned Song"}" (${h.progress} / ${h.target} mins completed)`
                            : h.type === "note"
                            ? `Identify Notes Game: ${h.target} notes (${h.progress} / ${h.target} completed)`
                            : h.type === "chord"
                            ? `Chord Builder Game: ${h.target} chords (${h.progress} / ${h.target} completed)`
                            : `Assignment: ${h.type} (${h.progress} / ${h.target})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1">Link to a Song</label>
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
                    {Array.from(new Set(videos.map(v => v.songName))).filter(Boolean).map((song) => (
                      <option key={song} value={song}>
                        {song}
                      </option>
                    ))}
                    <option value="custom">-- Type Custom Song Name --</option>
                  </select>
                </div>

                {logSongLink === "custom" && (
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1">Custom Song Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Moonlight Sonata"
                      value={logCustomSongName}
                      onChange={(e) => setLogCustomSongName(e.target.value)}
                      className="w-full bg-emerald-50/10 border-3 border-slate-800 rounded-2xl p-2.5 text-sm font-bold focus:outline-none shadow-[2px_2px_0px_#fef08a]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-600 mb-1">What did you work on?</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="e.g. Practiced scales. Hand coordination is getting better!"
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
              <h2 className="text-xl font-black text-emerald-600 border-b-3 border-slate-100 pb-1">Practice Journal</h2>
              {practiceLogs.length === 0 ? (
                <div className="bg-white border-4 border-slate-800 rounded-[2rem] p-6 text-center shadow-[4px_4px_0px_#a7f3d0]">
                  <p className="font-bold text-slate-400 text-sm">No logs posted yet. Let's start practicing.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                  {practiceLogs.map((log) => (
                    <div key={log.id} className="bg-white border-3 border-slate-800 p-4 rounded-2xl shadow-[3px_3px_0px_#fef08a] hover:scale-[1.01] transition-all">
                      <div className="flex justify-between font-black text-xs text-emerald-600 mb-2">
                        <span>Date: {log.date}</span>
                        <span className="bg-emerald-50 border border-slate-200 px-2 py-0.5 rounded-lg">{log.minutes} minutes</span>
                      </div>
                      {log.songName && (
                        <div className="mb-2">
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
        )}

        {/* TAB 4: VIDEOS LESSONS */}
        {activeTab === "videos" && (
          <div className="space-y-6">
            {/* Song Selection & Switcher Bar */}
            <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0]">
              <div className="flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-4 font-black text-xs text-slate-600">
                <span>{showArchived ? "Archived Songs Folder" : "Active Songs Folder"}</span>
                <button
                  onClick={() => { setShowArchived(!showArchived); setSelectedSong(""); }}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 rounded-xl text-[10px] font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  {showArchived ? "View Active Songs" : "View Archived Songs"}
                </button>
              </div>

              {/* Horizontal buttons to select songs */}
              <div className="flex flex-wrap gap-2">
                {showArchived ? (
                  archivedSongsList.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 italic">No archived song folders.</span>
                  ) : (
                    archivedSongsList.map(song => (
                      <button
                        key={song}
                        onClick={() => setSelectedSong(song)}
                        className={`px-3 py-1.5 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.03] active:translate-y-0.5 ${
                          selectedSong === song ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]" : "bg-white text-slate-800"
                        }`}
                      >
                        {song}
                      </button>
                    ))
                  )
                ) : (
                  activeSongs.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 italic">No song lessons shared yet.</span>
                  ) : (
                    activeSongs.map(song => (
                      <button
                        key={song}
                        onClick={() => setSelectedSong(song)}
                        className={`px-3 py-1.5 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.03] active:translate-y-0.5 ${
                          selectedSong === song ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]" : "bg-white text-slate-800"
                        }`}
                      >
                        {song}
                      </button>
                    ))
                  )
                )}
              </div>
            </div>

            {/* Embed videos list for selected song */}
            {selectedSong ? (
              <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0]">
                <h3 className="text-xl font-black text-emerald-600 mb-6 border-b-3 border-slate-100 pb-2 uppercase tracking-wide">
                  {selectedSong} {showArchived && <span className="text-[10px] bg-red-500 border border-slate-800 px-2 py-0.5 rounded-lg text-white ml-2">Archived</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedVideos[selectedSong] && groupedVideos[selectedSong].map((video) => (
                    <div key={video.id} className="border-3 border-slate-800 rounded-[1.5rem] p-4 bg-emerald-50/10 shadow-[3px_3px_0px_#fef08a] hover:scale-[1.01] transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-sm mb-1 text-slate-800">{video.title}</h4>
                        
                        {/* Composer Display */}
                        {video.composer && (
                          <div className="mb-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                            Composer: {video.composer}
                          </div>
                        )}

                        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-800 shadow-[2px_2px_0px_#a7f3d0]">
                          {video.url.includes("youtube.com/embed/") ? (
                            <iframe
                              src={video.url}
                              title={video.title}
                              className="absolute top-0 left-0 w-full h-full"
                              allowFullScreen
                            ></iframe>
                          ) : (
                            <div className="absolute inset-0 bg-emerald-50 flex justify-center items-center font-bold text-xs p-2 text-center text-slate-500">
                              Can only display YouTube embeds. {video.url}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Collapsible Comments Section */}
                      <div className="mt-4 border-t-2 border-slate-100 pt-3">
                        <button
                          type="button"
                          onClick={() => toggleComments(video.id)}
                          className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
                        >
                          Comments ({video.commentsCount || 0})
                        </button>

                        {expandedComments[video.id] && (
                          <div className="mt-3 bg-white border-3 border-slate-800 p-3 rounded-2xl shadow-[2px_2px_0px_#a7f3d0]">
                            <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1 text-left">
                              {commentsLoading[video.id] ? (
                                <p className="text-[10px] font-bold text-emerald-600 animate-pulse text-center">Loading comments... </p>
                              ) : (commentsData[video.id] || []).length === 0 ? (
                                <p className="text-[10px] font-bold text-slate-400 italic text-center py-1">No comments yet. Ask a question.</p>
                              ) : (
                                (commentsData[video.id] || []).map(comment => (
                                  <div key={comment.id} className="text-[11px] bg-emerald-50/30 p-2 rounded-xl border-2 border-slate-800">
                                    <div className="flex justify-between font-black text-[9px] text-emerald-600 mb-1">
                                      <span>{comment.name} (@{comment.username})</span>
                                      <span className="text-[8px] font-semibold text-slate-400">
                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-slate-800 leading-relaxed font-bold">{comment.text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            <div className="flex gap-1.5 mt-2">
                              <input
                                type="text"
                                placeholder="Ask a question..."
                                value={commentInputs[video.id] || ""}
                                onChange={(e) => handleCommentInputChange(video.id, e.target.value)}
                                className="flex-1 bg-emerald-50/10 border-2 border-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    submitComment(video.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => submitComment(video.id)}
                                className="px-3 py-1 bg-amber-300 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 rounded-xl text-xs font-black transition active:scale-[0.95] cursor-pointer"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              allSongNames.length > 0 && (
                <div className="text-center p-8 bg-white border-4 border-slate-800 rounded-[2.5rem] shadow-[6px_6px_0px_#a7f3d0]">
                  <p className="font-bold text-slate-400">Please select a song folder from the vault above.</p>
                </div>
              )
            )}
          </div>
        )}

        {/* TAB 5: STUDENT PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto space-y-8">
            {profileData ? (
              <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0]">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 border-b-3 border-slate-100 pb-2 mb-6">
                  My Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold text-slate-700">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Name</span>
                      <span className="text-2xl font-black text-emerald-600">{profileData.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Username / Email</span>
                      <span className="bg-emerald-100 border-2 border-slate-800 px-2 py-0.5 rounded text-xs font-black block w-fit mb-1 shadow-[1px_1px_0px_#fef08a]">
                        @{profileData.username}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{profileData.email}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Teacher</span>
                      <span className="text-lg font-black text-emerald-600">Teacher: {profileData.teacherName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wide">Teacher Connection Code</span>
                      <span className="bg-amber-100 border-2 border-slate-800 px-2.5 py-0.5 rounded text-xs font-black block w-fit shadow-[1px_1px_0px_#a7f3d0]">
                        {profileData.teacherCode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DANGER ZONE FOR ACCOUNT DELETION */}
                <div className="mt-8 border-t-3 border-dashed border-slate-200 pt-6">
                  <h4 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wide">Danger Zone</h4>
                  <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                    Deleting your student account is permanent and irreversible. All homework assignments, scores, logs, and video history will be permanently wiped.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-300 hover:bg-red-200 text-slate-800 border-3 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.03] transition-all cursor-pointer"
                  >
                    Permanently Delete My Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border-4 border-slate-800 rounded-[2rem] p-8 text-center shadow-lg">
                Loading profile...
              </div>
            )}

            {/* Saved Scoreboard panel */}
            <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-[6px_6px_0px_#a7f3d0]">
              <h3 className="text-xl font-black text-emerald-600 border-b-3 border-slate-100 pb-2 mb-6">
                High-Score Journal
              </h3>

              {freePracticeHistory.filter(item => item.type === "note").length === 0 ? (
                <p className="font-bold text-slate-400 text-sm italic">No practice scoreboard high-scores saved yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...freePracticeHistory]
                      .filter(item => item.type === "note")
                      .sort((a, b) => b.score - a.score)
                      .slice(0, showAllScores ? undefined : 5)
                      .map((scoreItem) => (
                        <div
                          key={scoreItem.id}
                          className="border-3 border-slate-800 rounded-[1.5rem] p-4 bg-emerald-50/10 shadow-[3px_3px_0px_#fef08a] flex justify-between items-center hover:scale-[1.02] transition-all"
                        >
                          <div>
                            <span className="font-black text-xs text-emerald-600 block uppercase">
                              {scoreItem.type === "note" ? "Note Matcher" : "Chord Builder"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">{scoreItem.date}</span>
                          </div>
                          <span className="bg-amber-300 border-2 border-slate-800 px-3 py-1 rounded-xl font-black text-sm shadow-[2px_2px_0px_#fef08a]">
                            {scoreItem.score} pts
                          </span>
                        </div>
                      ))}
                  </div>
                  {freePracticeHistory.filter(item => item.type === "note").length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllScores(!showAllScores)}
                      className="mt-6 mx-auto block px-5 py-2 bg-yellow-100 hover:bg-yellow-200 text-slate-800 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.03] transition-all cursor-pointer"
                    >
                      {showAllScores ? "See Less" : "See More"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
