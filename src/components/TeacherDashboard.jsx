import React, { useState, useEffect } from "react";

function SearchableStudentSelect({ value, onChange, students, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find(s => s.username === value);

  return (
    <div className="relative font-sans">
      <div 
        className="flex bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 items-center justify-between cursor-pointer focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all text-sm"
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          placeholder={selectedStudent ? `${selectedStudent.name} (@${selectedStudent.username})` : placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent w-full text-slate-800 outline-none placeholder:text-slate-800 focus:placeholder:text-slate-400 font-semibold"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-slate-400 hover:text-slate-600 outline-none ml-2 text-xs"
        >
          {isOpen ? "▲" : "▼"}
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto py-1 text-sm font-semibold">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-slate-400 italic">No matching students found</div>
            ) : (
              filtered.map(student => (
                <div
                  key={student.username}
                  onClick={() => {
                    onChange(student.username);
                    setSearch("");
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition ${
                    value === student.username ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-700"
                  }`}
                >
                  {student.name} <span className="text-[10px] text-slate-400 font-normal">(@{student.username})</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "assign" | "videos" | "profile"
  const [students, setStudents] = useState([]);
  const [videos, setVideos] = useState([]);
  const [archivedSongs, setArchivedSongs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // For detailed view modal
  const [teacherProfile, setTeacherProfile] = useState(null);

  // Song browsing states
  const [selectedSong, setSelectedSong] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [browseStudent, setBrowseStudent] = useState("");

  // Form states
  const [hwStudent, setHwStudent] = useState("");
  const [hwType, setHwType] = useState("note");
  const [hwTarget, setHwTarget] = useState(10);
  const [hwSongName, setHwSongName] = useState("");
  const [hwCustomSongName, setHwCustomSongName] = useState("");
  const [hwLoading, setHwLoading] = useState(false);
  const [hwMessage, setHwMessage] = useState(null);
  const [hwDueDate, setHwDueDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [vidStudent, setVidStudent] = useState("");
  const [vidSongName, setVidSongName] = useState("");
  const [vidTitle, setVidTitle] = useState("");
  const [vidUrl, setVidUrl] = useState("");
  const [clonedVideoUrl, setClonedVideoUrl] = useState("");
  const [isClonedVideoModalOpen, setIsClonedVideoModalOpen] = useState(false);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidMessage, setVidMessage] = useState(null);

  const [availableSongs, setAvailableSongs] = useState([]);
  const [songComposers, setSongComposers] = useState({});
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [newSongName, setNewSongName] = useState("");
  const [newComposer, setNewComposer] = useState("");

  const [loadingData, setLoadingData] = useState(true);

  // Edit Profile form states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLessonDay, setProfileLessonDay] = useState("Wednesday");
  const [profileMessage, setProfileMessage] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Grouped Weekly practice logs accordions
  const [expandedWeeks, setExpandedWeeks] = useState({}); // { [weekLabel]: boolean }

  // Notification Inbox States
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  useEffect(() => {
    if (!selectedStudent) {
      setExpandedWeeks({});
    }
  }, [selectedStudent]);

  // Condensed Roster & Video Comments
  const [isCondensed, setIsCondensed] = useState(false);
  const [expandedComments, setExpandedComments] = useState({}); // { [videoId]: boolean }
  const [commentsData, setCommentsData] = useState({}); // { [videoId]: Array }
  const [commentInputs, setCommentInputs] = useState({}); // { [videoId]: String }
  const [commentsLoading, setCommentsLoading] = useState({}); // { [videoId]: boolean }

  const getNextLessonDateString = (dayName) => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = DAYS.indexOf(dayName || 'Wednesday');
    const validDayIndex = targetDayIndex === -1 ? 3 : targetDayIndex;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayIndex = today.getDay();

    let daysToAdd = validDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Get next week's lesson day
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);

    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getWeekRangeForDate = (dateStr, lessonDayName) => {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = DAYS.indexOf(lessonDayName || 'Wednesday');
    const validDayIndex = targetDayIndex === -1 ? 3 : targetDayIndex;

    const [yearVal, monthVal, dayVal] = dateStr.split('-').map(Number);
    const logDate = new Date(yearVal, monthVal - 1, dayVal);
    logDate.setHours(0, 0, 0, 0);

    const currentDayIndex = logDate.getDay();

    // Calculate start date (most recent lessonDay <= logDate)
    let daysToSubtract = currentDayIndex - validDayIndex;
    if (daysToSubtract < 0) {
      daysToSubtract += 7;
    }

    const startDate = new Date(logDate);
    startDate.setDate(logDate.getDate() - daysToSubtract);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const formatMD = (dt) => `${dt.getMonth() + 1}/${dt.getDate()}`;
    return {
      label: `${formatMD(startDate)} - ${formatMD(endDate)}`,
      startDate,
      endDate
    };
  };

  const groupLogsByLessonWeeks = (logs, lessonDayName) => {
    const groups = {}; // { [weekLabel]: Array of logs }
    const weekStartDates = {}; // { [weekLabel]: Date }

    logs.forEach(log => {
      const { label, startDate } = getWeekRangeForDate(log.date, lessonDayName);
      if (!groups[label]) {
        groups[label] = [];
        weekStartDates[label] = startDate;
      }
      groups[label].push(log);
    });

    const sortedLabels = Object.keys(groups).sort((a, b) => weekStartDates[b] - weekStartDates[a]);
    return sortedLabels.map(label => ({
      label,
      logs: groups[label]
    }));
  };

  const fetchData = async () => {
    try {
      // Fetch students roster
      const resStudents = await fetch(`http://localhost:4000/api/students?teacherCode=${user.teacherCode}`);
      const dataStudents = await resStudents.json();
      setStudents(dataStudents);
      
      if (dataStudents.length > 0) {
        if (!hwStudent) setHwStudent(dataStudents[0].username);
        if (!vidStudent) setVidStudent(dataStudents[0].username);
      }

      // Fetch teacher profile
      const resProfile = await fetch(`http://localhost:4000/api/teacher-profile/${user.username}`);
      if (resProfile.ok) {
        const dataProfile = await resProfile.json();
        setTeacherProfile(dataProfile);
        setProfileName(dataProfile.name || "");
        setProfileEmail(dataProfile.email || "");
        setProfileLessonDay(dataProfile.lessonDay || "Wednesday");
        setHwDueDate(getNextLessonDateString(dataProfile.lessonDay));
      }

      // Fetch video list (scoped to teacher)
      const resVideos = await fetch(`http://localhost:4000/api/videos?teacherCode=${user.teacherCode}`);
      const dataVideos = await resVideos.json();
      setVideos(dataVideos);

      const uniqueSongs = Array.from(new Set(dataVideos.map(v => v.songName))).filter(Boolean);
      setAvailableSongs(uniqueSongs);

      const composersMap = {};
      dataVideos.forEach(v => {
        if (v.songName && v.composer) {
          composersMap[v.songName] = v.composer;
        }
      });
      setSongComposers(composersMap);

      // Fetch archived songs list
      const resArchive = await fetch("http://localhost:4000/api/songs/archive");
      const dataArchive = await resArchive.json();
      setArchivedSongs(dataArchive);

      // Fetch unread notifications
      const resNotifs = await fetch(`http://localhost:4000/api/notifications/teacher/${user.username}`);
      if (resNotifs.ok) {
        const dataNotifs = await resNotifs.json();
        setUnreadNotifications(dataNotifs);
      }
    } catch (err) {
      console.error("Error fetching teacher data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleAssignHomework = async (e) => {
    e.preventDefault();
    setHwLoading(true);
    setHwMessage(null);

    let finalSongName = null;
    if (hwType === "practice") {
      finalSongName = hwSongName === "custom" ? hwCustomSongName.trim() : hwSongName;
      if (!finalSongName) {
        setHwMessage({ type: "error", text: "Please select or enter a song name." });
        setHwLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("http://localhost:4000/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: hwStudent,
          type: hwType,
          target: parseInt(hwTarget),
          dueDate: hwDueDate,
          songName: finalSongName,
        }),
      });

      if (!res.ok) throw new Error("Could not assign homework.");
      
      setHwMessage({ type: "success", text: "Homework assigned successfully!" });
      setHwTarget(10);
      setHwSongName("");
      setHwCustomSongName("");
      const today = new Date();
      today.setDate(today.getDate() + 7);
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setHwDueDate(`${y}-${m}-${d}`);
      fetchData(); // Refresh list
    } catch (err) {
      setHwMessage({ type: "error", text: err.message });
    } finally {
      setHwLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);

    try {
      const res = await fetch("http://localhost:4000/api/teacher-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          name: profileName.trim(),
          email: profileEmail.trim(),
          lessonDay: profileLessonDay
        })
      });

      if (!res.ok) throw new Error("Could not update profile settings.");

      setProfileMessage({ type: "success", text: "Settings saved successfully!" });
      fetchData(); // Refresh teacher settings & student rosters
    } catch (err) {
      setProfileMessage({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setVidLoading(true);
    setVidMessage(null);

    if (!vidStudent) {
      setVidMessage({ type: "error", text: "Please select a student target first." });
      setVidLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songName: vidSongName.trim(),
          title: vidTitle.trim(),
          url: vidUrl.trim(),
          studentUsername: vidStudent,
          composer: songComposers[vidSongName.trim()] || "",
        }),
      });

      if (!res.ok) throw new Error("Could not add video lesson.");

      setVidMessage({ type: "success", text: "Video uploaded successfully!" });
      setVidSongName("");
      setVidTitle("");
      setVidUrl("");
      setClonedVideoUrl("");
      fetchData(); // Refresh list
    } catch (err) {
      setVidMessage({ type: "error", text: err.message });
    } finally {
      setVidLoading(false);
    }
  };

  const handleSongSelectChange = (value) => {
    if (value === "ADD_NEW_SONG") {
      setIsSongModalOpen(true);
    } else {
      setVidSongName(value);
    }
  };

  const handleClonedVideoSelect = (url) => {
    setClonedVideoUrl(url);
    if (url) {
      const match = videos.find(v => v.url === url);
      if (match) {
        setVidTitle(match.title);
        setVidUrl(match.url);
        if (match.songName) {
          setVidSongName(match.songName);
        }
      }
    } else {
      setVidTitle("");
      setVidUrl("");
    }
  };

  const handleAddSongSubmit = (e) => {
    e.preventDefault();
    if (!newSongName.trim()) return;

    const formattedSongName = newSongName.trim();
    const formattedComposer = newComposer.trim();

    if (!availableSongs.includes(formattedSongName)) {
      setAvailableSongs(prev => [...prev, formattedSongName]);
    }

    setSongComposers(prev => ({
      ...prev,
      [formattedSongName]: formattedComposer
    }));

    setVidSongName(formattedSongName);
    setNewSongName("");
    setNewComposer("");
    setIsSongModalOpen(false);
  };

  const handleDeleteTeacherAccount = async () => {
    const confirmDelete = window.confirm(
      "DANGER ZONE: Are you absolutely sure you want to permanently delete your teacher account?\n\n" +
      "This will erase your teacher profile and PERMANENTLY DELETE ALL STUDENTS registered under your teacher code, including all of their homework assignments, practice logs, high-scores, and lessons history! This action is completely irreversible!"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:4000/api/users/${user.username}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Your teacher account and all linked student accounts have been successfully deleted.");
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

  const handleToggleArchive = async (songName, isArchived) => {
    try {
      const res = await fetch("http://localhost:4000/api/songs/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songName, archived: isArchived })
      });
      if (res.ok) {
        // Fetch new archived states
        const resArchive = await fetch("http://localhost:4000/api/songs/archive");
        const dataArchive = await resArchive.json();
        setArchivedSongs(dataArchive);
        setSelectedSong(""); // Reset selection
      }
    } catch (err) {
      console.error("Error archiving song:", err);
    }
  };

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

        // Auto scroll to bottom
        setTimeout(() => {
          const el = document.getElementById(`comments-container-${videoId}`);
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        }, 100);

        // Automatically mark comments as read for the teacher
        await fetch(`http://localhost:4000/api/videos/${videoId}/comments/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "teacher" })
        });

        // Refetch unread notifications
        const resNotifs = await fetch(`http://localhost:4000/api/notifications/teacher/${user.username}`);
        if (resNotifs.ok) {
          const dataNotifs = await resNotifs.json();
          setUnreadNotifications(dataNotifs);
        }
      } catch (err) {
        console.error("Failed to load/mark read comments:", err);
      } finally {
        setCommentsLoading(prev => ({ ...prev, [videoId]: false }));
      }
    }
  };

  const handleMarkNotificationRead = async (videoId) => {
    try {
      await fetch(`http://localhost:4000/api/videos/${videoId}/comments/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "teacher" })
      });
      const resNotifs = await fetch(`http://localhost:4000/api/notifications/teacher/${user.username}`);
      if (resNotifs.ok) {
        const dataNotifs = await resNotifs.json();
        setUnreadNotifications(dataNotifs);
      }
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const uniqueVideoIds = Array.from(new Set(unreadNotifications.map(n => n.videoId)));
      await Promise.all(uniqueVideoIds.map(vId => 
        fetch(`http://localhost:4000/api/videos/${vId}/comments/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "teacher" })
        })
      ));
      setUnreadNotifications([]);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleUpdateStudentLessonDay = async (studentUsername, newLessonDay) => {
    try {
      const res = await fetch(`http://localhost:4000/api/students/${studentUsername}/lesson-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonDay: newLessonDay })
      });
      if (res.ok) {
        // Refresh local dashboard data (fetchData refreshes the student roster stats!)
        fetchData();
        // Keep selected student popup in sync
        setSelectedStudent(prev => prev ? { ...prev, lessonDay: newLessonDay } : null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update lesson day");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update lesson day");
    }
  };

  const handleGoToVideo = async (videoNotif) => {
    setIsInboxOpen(false);
    setActiveTab("videos");
    setVidStudent(videoNotif.studentUsername);
    setBrowseStudent(videoNotif.studentUsername);
    setSelectedSong(videoNotif.songName);
    setExpandedComments(prev => ({ ...prev, [videoNotif.videoId]: true }));
    setCommentsLoading(prev => ({ ...prev, [videoNotif.videoId]: true }));
    try {
      const res = await fetch(`http://localhost:4000/api/videos/${videoNotif.videoId}/comments`);
      const data = await res.json();
      setCommentsData(prev => ({ ...prev, [videoNotif.videoId]: data }));

      await fetch(`http://localhost:4000/api/videos/${videoNotif.videoId}/comments/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "teacher" })
      });

      const resNotifs = await fetch(`http://localhost:4000/api/notifications/teacher/${user.username}`);
      if (resNotifs.ok) {
        const dataNotifs = await resNotifs.json();
        setUnreadNotifications(dataNotifs);
      }

      // Smoothly scroll to the target video and to the bottom of the comments list
      setTimeout(() => {
        const el = document.getElementById(`video-card-${videoNotif.videoId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const commEl = document.getElementById(`comments-container-${videoNotif.videoId}`);
        if (commEl) {
          commEl.scrollTop = commEl.scrollHeight;
        }
      }, 300);

    } catch (err) {
      console.error("Failed to go to video/load comments:", err);
    } finally {
      setCommentsLoading(prev => ({ ...prev, [videoNotif.videoId]: false }));
    }
  };

  const formatCommentDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    const now = new Date();
    const commentDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (commentDate.getTime() === todayDate.getTime()) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
        
        // Auto scroll to bottom
        setTimeout(() => {
          const el = document.getElementById(`comments-container-${videoId}`);
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        }, 100);

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

  const filteredVideosByStudent = browseStudent 
    ? videos.filter(v => v.studentUsername.toLowerCase() === browseStudent.toLowerCase())
    : [];

  // Group videos by song name
  const groupedVideos = filteredVideosByStudent.reduce((acc, video) => {
    if (!acc[video.songName]) {
      acc[video.songName] = [];
    }
    acc[video.songName].push(video);
    return acc;
  }, {});

  const allSongNames = Object.keys(groupedVideos);
  const activeSongs = allSongNames.filter(name => !archivedSongs.includes(name));
  const archivedSongsList = allSongNames.filter(name => archivedSongs.includes(name));

  const uniquePastVideos = Array.from(
    new Map(videos.map(v => [v.url, { title: v.title, url: v.url, composer: v.composer || "", songName: v.songName }])).values()
  );

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

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row p-4 font-sans text-slate-800 gap-8 items-start">
      {/* LEFT SIDEBAR (reduces vertical scroll) */}
      <div className="w-full md:w-64 flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40 flex flex-col gap-6 md:sticky md:top-4 select-none">
        {/* Branding */}
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
            Teacher
          </h1>
          <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight leading-none mt-1">
            Dashboard
          </h1>
          <div className="mt-3">
            <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg text-[9px] font-bold text-indigo-600 block w-fit">
              Code: {user.teacherCode}
            </span>
          </div>
          <p className="font-bold text-slate-400 mt-2 text-[10px] uppercase tracking-wider">
            Teacher: {user.name}
          </p>
        </div>

        {/* Navigation Tabs (Vertical Stack!) */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("roster")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
              activeTab === "roster"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            Student Roster
          </button>

          <button
            onClick={() => setActiveTab("assign")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
              activeTab === "assign"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            Assign Homework
          </button>

          <button
            onClick={() => setActiveTab("videos")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
              activeTab === "videos"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            Video Lessons
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition duration-200 cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
            }`}
          >
            My Profile
          </button>
        </div>

        {/* Sidebar Actions */}
        <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-2">
          <button
            onClick={() => setIsInboxOpen(true)}
            className="w-full relative px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] cursor-pointer flex items-center justify-between"
          >
            <span>Inbox Messages</span>
            {unreadNotifications.length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onLogout()}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer border border-slate-200/50 text-center"
          >
            Logout
          </button>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 w-full">
        {loadingData ? (
          <div className="text-xl font-bold text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/40">
            Syncing classroom data...
          </div>
        ) : (
          <div className="w-full">
          {/* TAB 1: STUDENT ROSTER */}
          {activeTab === "roster" && (
            <div className="flex flex-col gap-6">
              {students.length > 0 && (
                <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-4 shadow-md shadow-slate-100/30">
                  <span className="text-sm font-semibold text-slate-500">
                    Classroom Size: <span className="font-extrabold text-slate-800">{students.length} students</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCondensed(!isCondensed)}
                    className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.95] flex items-center gap-1 cursor-pointer select-none"
                  >
                    {isCondensed ? "Expand Student Cards" : "Condensed List View"}
                  </button>
                </div>
              )}

              {students.length === 0 ? (
                <div className="text-center p-8 bg-white border border-slate-200/80 rounded-2xl shadow-lg shadow-slate-100/30">
                  <p className="text-lg font-bold text-slate-500">No students registered yet!</p>
                </div>
              ) : isCondensed ? (
                /* CONDENSED CLASSROOM LIST VIEW */
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100/30 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Username</th>
                          <th className="px-6 py-3.5">Practice ({students.length > 0 ? students[0].weekLabel : "This Week"})</th>
                          <th className="px-6 py-3.5">Active Homework</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {students.map((student) => {
                          const activeHW = student.homework.find((h) => !h.completed);
                          return (
                            <tr key={student.username} className="hover:bg-slate-50/50 transition">
                              <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                              <td className="px-6 py-4 font-semibold text-slate-500">@{student.username}</td>
                              <td className="px-6 py-4 font-bold text-indigo-600">{student.totalMinutes} mins</td>
                              <td className="px-6 py-4">
                                {activeHW ? (
                                  <div className="flex items-center gap-2">
                                    <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600">
                                      {activeHW.type === "note" 
                                        ? "Note Match" 
                                        : activeHW.type === "chord" 
                                        ? "Chord Build" 
                                        : `Practice: ${activeHW.songName || "Song"}`}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      ({activeHW.progress}/{activeHW.target}{activeHW.type === "practice" ? "m" : ""})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">None</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudent(student)}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition active:scale-[0.96] cursor-pointer"
                                >
                                  Progress
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* EXPANDED GRID CARD VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {students.map((student) => {
                    const activeHW = student.homework.find((h) => !h.completed);
                    return (
                      <div
                        key={student.username}
                        className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-slate-800">{student.name}</h3>
                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-slate-600">
                              @{student.username}
                            </span>
                          </div>

                          {/* Practice Time */}
                          <div className="mb-4 bg-indigo-50/50 border border-indigo-100/50 p-3 rounded-xl">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Weekly Practice Time ({student.weekLabel})
                            </span>
                            <span className="text-2xl font-extrabold text-indigo-600">
                              {student.totalMinutes} <span className="text-sm font-medium text-slate-500">minutes</span>
                            </span>
                          </div>

                          {/* Homework status */}
                          <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Homework:</h4>
                            {activeHW ? (
                              <div>
                                <p className="font-semibold text-sm text-slate-700">
                                  {activeHW.type === "note" 
                                    ? "Identify Notes" 
                                    : activeHW.type === "chord" 
                                    ? "Build Chords" 
                                    : `Practice: "${activeHW.songName || "Assigned Song"}"`} (Goal: {activeHW.target} {activeHW.type === "practice" ? "mins" : "q's"})
                                </p>
                                {/* Progress bar */}
                                <div className="w-full bg-slate-200/60 border border-slate-300/30 h-3 rounded-full overflow-hidden mt-2 relative">
                                  <div
                                    className="bg-indigo-500 h-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (activeHW.progress / activeHW.target) * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                                  {activeHW.progress} / {activeHW.target} {activeHW.type === "practice" ? "minutes" : "questions"} completed
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-slate-400 italic">No active homework assignments.</p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="w-full mt-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition duration-200 active:scale-[0.98] cursor-pointer"
                        >
                          View Detailed Progress
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASSIGN HOMEWORK */}
          {activeTab === "assign" && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Student</label>
                  <SearchableStudentSelect
                    value={hwStudent}
                    onChange={(val) => setHwStudent(val)}
                    students={students}
                    placeholder="Search student..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Game Mode</label>
                  <select
                    value={hwType}
                    onChange={(e) => setHwType(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer"
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
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Song to Practice</label>
                      <select
                        required
                        value={hwSongName}
                        onChange={(e) => setHwSongName(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer"
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
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Custom Song Name</label>
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
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {hwType === "practice" ? "Target Duration (Minutes)" : "Target Score (Correct Answers)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={hwType === "practice" ? "480" : "100"}
                    required
                    value={hwTarget}
                    onChange={(e) => setHwTarget(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={hwDueDate}
                      onChange={(e) => setHwDueDate(e.target.value)}
                      className="flex-1 bg-slate-50/50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer"
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
          )}

          {/* TAB 3: VIDEO LESSONS */}
          {activeTab === "videos" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Upload Form */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40 lg:col-span-1 h-fit">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                  Share Slow-Mo Video
                </h2>

                {vidMessage && (
                  <div
                    className={`border p-2.5 rounded-xl font-semibold text-center text-xs mb-4 ${
                      vidMessage.type === "success"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-red-50 border-red-100 text-red-800"
                    }`}
                  >
                    {vidMessage.text}
                  </div>
                )}

                <form onSubmit={handleAddVideo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Student</label>
                    <SearchableStudentSelect
                      value={vidStudent}
                      onChange={(val) => setVidStudent(val)}
                      students={students}
                      placeholder="Search student..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Song Name</label>
                    <select
                      value={vidSongName}
                      onChange={(e) => handleSongSelectChange(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none cursor-pointer"
                      required
                      disabled={!vidStudent}
                    >
                      <option value="" disabled>-- Select a Song --</option>
                      <option value="ADD_NEW_SONG" className="font-bold text-indigo-600 bg-indigo-50">
                        -- Add New Song... --
                      </option>
                      {(() => {
                        const currentStudentActiveVideos = vidStudent
                          ? videos.filter(v => v.studentUsername.toLowerCase() === vidStudent.toLowerCase() && !archivedSongs.includes(v.songName))
                          : [];
                        const currentStudentActiveSongs = Array.from(new Set(currentStudentActiveVideos.map(v => v.songName))).filter(Boolean);
                        
                        // Include the newly added song in options if it's not already there
                        if (vidSongName && vidSongName !== "ADD_NEW_SONG" && !currentStudentActiveSongs.includes(vidSongName)) {
                          currentStudentActiveSongs.push(vidSongName);
                        }

                        return currentStudentActiveSongs.map((songName) => (
                          <option key={songName} value={songName}>
                            {songName}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lesson Part/Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bars 9-16 (Slow right hand)"
                      value={vidTitle}
                      onChange={(e) => setVidTitle(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">YouTube URL</label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      value={vidUrl}
                      onChange={(e) => setVidUrl(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                    />
                  </div>

                  {(() => {
                    const otherStudentsVideosForSong = vidSongName
                      ? videos.filter(v =>
                          v.songName.toLowerCase() === vidSongName.toLowerCase() &&
                          v.studentUsername.toLowerCase() !== vidStudent.toLowerCase()
                        )
                      : [];
                    const hasCommonVideos = otherStudentsVideosForSong.length > 0;
                    return (
                      <button
                        type="button"
                        onClick={() => setIsClonedVideoModalOpen(true)}
                        disabled={!hasCommonVideos}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] cursor-pointer border ${
                          hasCommonVideos
                            ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        Choose Existing Video for this Song
                      </button>
                    );
                  })()}

                  <button
                    type="submit"
                    disabled={vidLoading || students.length === 0}
                    className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    {vidLoading ? "Uploading..." : "Save and Send Video"}
                  </button>
                </form>
              </div>

              {/* Videos Library Selector */}
              <div className="lg:col-span-2 space-y-6">
                {/* Selector Header Panel */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Student to Browse Library</label>
                    <SearchableStudentSelect
                      value={browseStudent}
                      onChange={(val) => {
                        setBrowseStudent(val);
                        setSelectedSong("");
                      }}
                      students={students}
                      placeholder="Search student..."
                    />
                  </div>

                  {browseStudent ? (
                    <>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-4 pb-3 mb-4">
                        <h3 className="text-sm font-bold text-slate-700">
                          {showArchived ? "Archived Songs Folder" : "Active Lessons Library"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => { setShowArchived(!showArchived); setSelectedSong(""); }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition duration-200 cursor-pointer active:scale-[0.98]"
                        >
                          {showArchived ? "View Active Songs" : "View Archived Songs"}
                        </button>
                      </div>

                      {/* Horizontal Song Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {showArchived ? (
                          archivedSongsList.length === 0 ? (
                            <span className="text-xs font-medium text-slate-400 italic">No archived songs for this student.</span>
                          ) : (
                            archivedSongsList.map(song => (
                              <button
                                key={song}
                                onClick={() => setSelectedSong(song)}
                                className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                                  selectedSong === song
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {song}
                              </button>
                            ))
                          )
                        ) : (
                          activeSongs.length === 0 ? (
                            <span className="text-xs font-medium text-slate-400 italic">No active songs in this student's lessons library.</span>
                          ) : (
                            activeSongs.map(song => (
                              <button
                                key={song}
                                onClick={() => setSelectedSong(song)}
                                className={`px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
                                  selectedSong === song
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {song}
                              </button>
                            ))
                          )
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 italic">Please select a student from the dropdown above to browse their assigned lessons and video history.</p>
                    </div>
                  )}
                </div>

                {/* Videos for the Selected Song */}
                {selectedSong ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl shadow-slate-100/40">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
                      <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wide">
                        {selectedSong} {songComposers[selectedSong] && `(Composer: ${songComposers[selectedSong]})`}
                      </h3>
                      <button
                        onClick={() => handleToggleArchive(selectedSong, !showArchived)}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition duration-200 cursor-pointer active:scale-[0.98] ${
                          showArchived
                            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                            : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                        }`}
                      >
                        {showArchived ? "Unarchive Song" : "Archive Song"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groupedVideos[selectedSong] && groupedVideos[selectedSong].map((video) => (
                        <div key={video.id} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 shadow-sm flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-sm mb-1 text-slate-800">{video.title}</h4>
                            
                            {/* Composer Display */}
                            {video.composer && (
                              <div className="mb-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded w-fit">
                                Composer: {video.composer}
                              </div>
                            )}

                            <div className="mb-3 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded w-fit">
                              For Student: @{video.studentUsername}
                            </div>
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                              {video.url.includes("youtube.com/embed/") ? (
                                <iframe
                                  src={video.url}
                                  title={video.title}
                                  className="absolute top-0 left-0 w-full h-full"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="absolute inset-0 bg-slate-100 flex justify-center items-center font-bold text-xs p-2 text-center text-red-600">
                                  Unsupported URL: Can only display YouTube embeds. {video.url}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Collapsible Comments Section (Sleek Theme) */}
                          <div className="mt-4 border-t border-slate-200/80 pt-3">
                            <button
                              type="button"
                              onClick={() => toggleComments(video.id)}
                              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer select-none"
                            >
                              {expandedComments[video.id] ? "Hide Comments" : `Comments (${video.commentsCount || 0})`}
                            </button>

                            {expandedComments[video.id] && (
                              <div className="mt-3 bg-slate-100/50 border border-slate-200/80 p-3 rounded-xl shadow-sm">
                                <div id={`comments-container-${video.id}`} className="max-h-36 overflow-y-auto space-y-2.5 pr-1 text-left">
                                  {commentsLoading[video.id] ? (
                                    <p className="text-[10px] font-bold text-indigo-500 animate-pulse text-center">Loading comments...</p>
                                  ) : (commentsData[video.id] || []).length === 0 ? (
                                    <p className="text-[10px] font-medium text-slate-400 italic text-center py-1">No comments yet. Post an answer!</p>
                                  ) : (
                                    (commentsData[video.id] || []).map(comment => (
                                      <div key={comment.id} className="text-[11px] bg-white p-2 rounded-lg border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                        <div className="flex justify-between font-bold text-[9px] text-slate-500 mb-1">
                                          <span>{comment.name} (@{comment.username})</span>
                                          <span className="text-[8px] font-medium text-slate-400">
                                            {formatCommentDate(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-slate-700 leading-relaxed font-medium">{comment.text}</p>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <div className="flex gap-1.5 mt-2">
                                  <input
                                    type="text"
                                    placeholder="Reply to student..."
                                    value={commentInputs[video.id] || ""}
                                    onChange={(e) => handleCommentInputChange(video.id, e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500"
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
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition active:scale-[0.95] cursor-pointer"
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
                    <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/40">
                      <p className="font-medium text-slate-400 text-sm">Please select a song from the tabs above to view lessons.</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TEACHER PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl mx-auto space-y-8">
              {teacherProfile ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-100/50">
                  <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">
                    Teacher Profile
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Name</span>
                        <span className="text-lg font-bold text-slate-800">{teacherProfile.name}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Username / Email</span>
                        <span className="bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded text-xs font-semibold text-indigo-700 block w-fit mb-1">
                          @{teacherProfile.username}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">{teacherProfile.email}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Teacher Connection Code</span>
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-sm font-bold text-slate-700 block w-fit mb-4">
                          {teacherProfile.teacherCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Weekly Lesson Day</span>
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-sm font-bold text-slate-700 block w-fit">
                          {teacherProfile.lessonDay || "Wednesday"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EDIT PROFILE & LESSON SETTINGS FORM */}
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Edit Profile & Lesson Settings</h3>
                    {profileMessage && (
                      <div
                        className={`border p-2.5 rounded-xl text-xs font-semibold mb-4 text-center ${
                          profileMessage.type === "success"
                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                            : "bg-red-50 border-red-100 text-red-800"
                        }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}
                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Display Name</label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                          <input
                            type="email"
                            required
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Weekly Lesson Day</label>
                        <select
                          value={profileLessonDay}
                          onChange={(e) => setProfileLessonDay(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-xs outline-none cursor-pointer"
                        >
                          <option value="Sunday">Sunday</option>
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                        </select>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          Practice minutes calculations and student rosters reset automatically on this day every week.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
                      >
                        {profileSaving ? "Saving Settings..." : "Save Profile Settings"}
                      </button>
                    </form>
                  </div>

                  {/* DANGER ZONE FOR TEACHER ACCOUNT DELETION */}
                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h4 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wide">Danger Zone</h4>
                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                      Deleting your teacher account is permanent and irreversible. <strong>ALL STUDENTS linked to your connection code</strong> will be permanently deleted along with all their homework, logs, scores, and video records!
                    </p>
                    <button
                      onClick={handleDeleteTeacherAccount}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition duration-200 active:scale-[0.98] shadow-md shadow-red-100 cursor-pointer"
                    >
                      Permanently Delete My Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
                  Loading teacher profile...
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* DETAIL WORKFLOW MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-3xl rounded-2xl p-6 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto font-sans">
            
            {/* Modal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedStudent.name}</h2>
                <p className="font-semibold text-slate-400 mt-1 text-sm">Detailed Progress & Practice Journal</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Lesson Day:</label>
                  <select
                    value={selectedStudent.lessonDay || "Wednesday"}
                    onChange={(e) => handleUpdateStudentLessonDay(selectedStudent.username, e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-500 transition-all"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition duration-200 cursor-pointer active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* COLUMN 1: MANUAL PRACTICE JOURNAL GROUPED BY WEEKS */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Practice Journal Logs</h3>
                {selectedStudent.practiceLogs.length === 0 ? (
                  <p className="text-slate-400 text-xs italic font-semibold">No entries logged yet.</p>
                ) : (() => {
                  const groupedWeeks = groupLogsByLessonWeeks(selectedStudent.practiceLogs, selectedStudent.lessonDay || teacherProfile?.lessonDay);
                  return (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                      {groupedWeeks.map((group) => {
                        const isCurrent = group.label === selectedStudent.weekLabel;
                        const isExpanded = expandedWeeks[group.label] !== undefined ? expandedWeeks[group.label] : isCurrent;
                        
                        return (
                          <div key={group.label} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white text-xs">
                            {/* Week Header Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedWeeks(prev => ({
                                  ...prev,
                                  [group.label]: !isExpanded
                                }));
                              }}
                              className={`w-full text-left px-3.5 py-2.5 flex justify-between items-center font-bold text-[11px] cursor-pointer select-none transition ${
                                isCurrent 
                                  ? 'bg-indigo-50 border-b border-indigo-100 text-indigo-700' 
                                  : 'bg-slate-50 border-b border-slate-100 hover:bg-slate-100/60 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{isCurrent ? "Current Week" : "Past Lesson Week"} ({group.label})</span>
                                <span className="bg-slate-200/80 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                  {group.logs.length} {group.logs.length === 1 ? 'log' : 'logs'}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                {isExpanded ? "Collapse" : "Expand"}
                              </span>
                            </button>
                            
                            {/* Week Logs List */}
                            {isExpanded && (
                              <div className="divide-y divide-slate-100 p-3 space-y-3 max-h-[28vh] overflow-y-auto bg-slate-50/20">
                                {group.logs.map((log) => (
                                  <div key={log.id} className="first:pt-0 pt-3">
                                    <div className="flex justify-between font-semibold text-[11px] text-indigo-600 mb-1">
                                      <span>{log.date}</span>
                                      <span className="bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded text-[9px]">{log.minutes} mins</span>
                                    </div>
                                    {log.songName && (
                                      <div className="mb-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-bold text-amber-700 w-fit">
                                        Song: {log.songName}
                                      </div>
                                    )}
                                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">"{log.notes}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* COLUMN 2: FREE PRACTICE STATS & HOMEWORK HISTORY */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Free Practice History</h3>
                  {selectedStudent.freePractice.filter(s => s.type === "note").length === 0 ? (
                    <p className="text-slate-400 text-xs italic font-semibold mt-3">No sessions completed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[22vh] overflow-y-auto mt-3 pr-2">
                      {selectedStudent.freePractice.filter(s => s.type === "note").map((session) => (
                        <div key={session.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold">
                          <div>
                            <span className="text-slate-700 font-bold">{session.type === "note" ? "Note Identification" : "Chord Building"}</span>
                            <div className="text-[10px] text-slate-400">{session.date}</div>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100/50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                            Score: {session.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">Assignment Log</h3>
                  <div className="space-y-2 max-h-[18vh] overflow-y-auto mt-3 pr-2">
                    {selectedStudent.homework.map((hw) => (
                      <div
                        key={hw.id}
                        className={`border p-2.5 rounded-xl flex justify-between items-center text-xs font-semibold ${
                          hw.completed 
                            ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
                            : "bg-amber-50/50 border-amber-100 text-amber-800"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-700">
                            {hw.type === "note" 
                              ? "Identify Notes" 
                              : hw.type === "chord" 
                              ? "Build Chords" 
                              : `Practice: "${hw.songName || "Assigned Song"}"`}
                          </div>
                          <div className="text-[9px] text-slate-400">Assigned: {hw.assignedAt}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{hw.completed ? "Completed" : "In Progress"}</div>
                          <div className="text-[10px] text-slate-400">({hw.progress} / {hw.target} {hw.type === "practice" ? "mins" : ""})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SONG MODAL */}
      {isSongModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 max-w-sm w-full font-sans">
            <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight">
              Add New Song
            </h3>
            <form onSubmit={handleAddSongSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Song Name (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Für Elise"
                  value={newSongName}
                  onChange={(e) => setNewSongName(e.target.value)}
                  onKeyDown={(e) => {
                    const uniqueSystemSongs = Array.from(new Set(videos.map(v => v.songName))).filter(Boolean);
                    const autocompleteSuggestions = newSongName.trim()
                      ? uniqueSystemSongs.filter(song =>
                          song.toLowerCase().includes(newSongName.toLowerCase()) &&
                          song.toLowerCase() !== newSongName.trim().toLowerCase()
                        )
                      : [];
                    if (e.key === "Tab" || e.key === "Enter") {
                      if (autocompleteSuggestions.length > 0) {
                        e.preventDefault();
                        const chosen = autocompleteSuggestions[0];
                        setNewSongName(chosen);
                        if (songComposers[chosen]) {
                          setNewComposer(songComposers[chosen]);
                        }
                      }
                    }
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                  autoComplete="off"
                />

                {(() => {
                  const uniqueSystemSongs = Array.from(new Set(videos.map(v => v.songName))).filter(Boolean);
                  const autocompleteSuggestions = newSongName.trim()
                    ? uniqueSystemSongs.filter(song =>
                        song.toLowerCase().includes(newSongName.toLowerCase()) &&
                        song.toLowerCase() !== newSongName.trim().toLowerCase()
                      )
                    : [];
                  if (autocompleteSuggestions.length === 0) return null;
                  return (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 shadow-lg rounded-xl max-h-32 overflow-y-auto py-1 text-xs font-semibold text-slate-700">
                      {autocompleteSuggestions.map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => {
                            setNewSongName(suggestion);
                            if (songComposers[suggestion]) {
                              setNewComposer(songComposers[suggestion]);
                            }
                          }}
                          className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition text-left"
                        >
                          {suggestion} {songComposers[suggestion] && <span className="text-[10px] text-slate-400 font-normal">({songComposers[suggestion]})</span>}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Composer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Beethoven"
                  value={newComposer}
                  onChange={(e) => setNewComposer(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Add Song
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSongModalOpen(false);
                    setVidSongName("");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTIFICATION INBOX MODAL */}
      {isInboxOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6 max-w-lg w-full font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 font-sans">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Comment Inbox
              </h3>
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {unreadNotifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-slate-400 italic">No unread comments in your inbox.</p>
                <button
                  onClick={() => setIsInboxOpen(false)}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-700 font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer"
                >
                  Close Inbox
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                  {unreadNotifications.map((notif) => (
                    <div key={notif.id} className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl shadow-sm text-left flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                          <span>Student: {notif.studentName} (@{notif.studentUsername})</span>
                          <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs font-black text-slate-700 mb-2">
                          On Video: "{notif.videoTitle}" ({notif.songName})
                        </div>
                        <p className="text-xs text-slate-600 italic bg-white border border-slate-100 p-2.5 rounded-lg font-medium leading-relaxed">
                          "{notif.text}"
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleMarkNotificationRead(notif.videoId)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 font-bold rounded-lg text-[10px] transition duration-200 cursor-pointer"
                        >
                          Mark Read
                        </button>
                        <button
                          onClick={() => handleGoToVideo(notif)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition duration-200 cursor-pointer shadow-sm shadow-indigo-100"
                        >
                          Go to Video
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsInboxOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-slate-100"
                  >
                    Close Inbox
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHOOSE CLONED VIDEO MODAL */}
      {isClonedVideoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-slate-800 shadow-2xl rounded-3xl p-6 max-w-lg w-full font-sans">
            <div className="flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Choose Existing Video
              </h3>
              <button
                onClick={() => setIsClonedVideoModalOpen(false)}
                className="text-xs font-black text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">
              Select a video previously uploaded for "{vidSongName}" to re-use:
            </p>

            {(() => {
              const otherStudentsVideosForSong = vidSongName
                ? videos.filter(v =>
                    v.songName.toLowerCase() === vidSongName.toLowerCase() &&
                    v.studentUsername.toLowerCase() !== vidStudent.toLowerCase()
                  )
                : [];
              
              const uniqueClonedVideos = [];
              const seenUrls = new Set();
              for (const video of otherStudentsVideosForSong) {
                if (!seenUrls.has(video.url)) {
                  seenUrls.add(video.url);
                  uniqueClonedVideos.push(video);
                }
              }

              if (uniqueClonedVideos.length === 0) {
                return (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-slate-400 italic">No existing uploads found for this song.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {uniqueClonedVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        handleClonedVideoSelect(video.url);
                        setIsClonedVideoModalOpen(false);
                      }}
                      className="group bg-slate-50/50 hover:bg-indigo-50/30 border-3 border-slate-800 p-4 rounded-2xl shadow-[3px_3px_0px_#1e293b] hover:shadow-[3px_3px_0px_#6366f1] transition-all cursor-pointer flex justify-between items-center text-left"
                    >
                      <div className="flex-1 mr-4">
                        <div className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition mb-1">
                          {video.title}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 truncate max-w-xs">
                          {video.url}
                        </div>
                        <div className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-wide">
                          Shared with: {video.studentUsername}
                        </div>
                      </div>
                      <span className="bg-indigo-600 text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-sm opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
                        Select Video
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsClonedVideoModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-800 text-slate-700 font-black rounded-xl text-xs transition duration-200 active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_#1e293b]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
