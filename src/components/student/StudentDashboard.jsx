import React, { useState, useEffect } from "react";
import StudentSidebar from "./StudentSidebar";
import HomeworkTab from "./HomeworkTab";
import ArcadeTab from "./ArcadeTab";
import PracticeLogTab from "./PracticeLogTab";
import StudentVideosTab from "./StudentVideosTab";
import StudentProfileTab from "./StudentProfileTab";
import useStudentData from "../../hooks/useStudentData";

export default function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("homework"); // "homework" | "free" | "logs" | "videos" | "profile"
  const [isPlayingHW, setIsPlayingHW] = useState(false);
  const [hwCount, setHwCount] = useState(0);
  const [logHwLink, setLogHwLink] = useState("");
  const [staffHighScore, setStaffHighScore] = useState(0);

  // Load custom student stats in background
  const {
    profileData,
    homeworkList,
    hwActiveItem,
    setHwActiveItem,
    practiceLogs,
    videos,
    archivedSongs,
    unreadNotifications,
    loading,
    fetchStudentData
  } = useStudentData(user?.username);

  // Load high scores on mount
  useEffect(() => {
    if (user && user.username) {
      setStaffHighScore(parseInt(localStorage.getItem(`piano_high_score_${user.username}_staff`) || "0", 10));
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const uncompletedHWCount = homeworkList.filter((h) => !h.completed).length;

  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row p-4 font-mono text-slate-800 gap-8 items-start">
      {/* Sidebar navigation */}
      <StudentSidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        uncompletedHWCount={uncompletedHWCount}
        unreadNotificationsCount={unreadNotifications.length}
        onLogout={onLogout}
      />

      {/* Primary views panels */}
      <div className="flex-1 w-full">
        {loading && !profileData && (
          <div className="bg-white border-4 border-slate-800 rounded-[2rem] p-8 text-center shadow-lg font-black animate-pulse">
            Loading dashboard data... 🎹
          </div>
        )}

        {/* Tab views */}
        {activeTab === "homework" && (
          <HomeworkTab
            user={user}
            homeworkList={homeworkList}
            isPlayingHW={isPlayingHW}
            setIsPlayingHW={setIsPlayingHW}
            hwActiveItem={hwActiveItem}
            setHwActiveItem={setHwActiveItem}
            hwCount={hwCount}
            setHwCount={setHwCount}
            fetchStudentData={fetchStudentData}
            setLogHwLink={setLogHwLink}
            setActiveTab={setActiveTab}
            staffHighScore={staffHighScore}
            setStaffHighScore={setStaffHighScore}
          />
        )}

        {activeTab === "free" && (
          <ArcadeTab
            user={user}
            staffHighScore={staffHighScore}
            setStaffHighScore={setStaffHighScore}
          />
        )}

        {activeTab === "logs" && (
          <PracticeLogTab
            user={user}
            homeworkList={homeworkList}
            videos={videos}
            practiceLogs={practiceLogs}
            logHwLink={logHwLink}
            setLogHwLink={setLogHwLink}
            fetchStudentData={fetchStudentData}
          />
        )}

        {activeTab === "videos" && (
          <StudentVideosTab
            user={user}
            videos={videos}
            unreadNotifications={unreadNotifications}
            archivedSongs={archivedSongs}
            fetchStudentData={fetchStudentData}
          />
        )}

        {activeTab === "profile" && (
          <StudentProfileTab
            profileData={profileData}
            user={user}
            onLogout={onLogout}
          />
        )}
      </div>
    </div>
  );
}
