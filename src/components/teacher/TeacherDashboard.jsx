import React, { useState, useEffect } from "react";
import TeacherSidebar from "./TeacherSidebar";
import RosterTab from "./RosterTab";
import AssignHomeworkTab from "./AssignHomeworkTab";
import TeacherVideosTab from "./TeacherVideosTab";
import TeacherProfileTab from "./TeacherProfileTab";
import StudentDetailModal from "./StudentDetailModal";
import CommentInboxModal from "./CommentInboxModal";
import useTeacherData from "../../hooks/useTeacherData";
import { markCommentsRead, getTeacherNotifications } from "../../api/videosApi";

export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("roster");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // States to deep-link comments inbox notifications
  const [initialBrowseStudent, setInitialBrowseStudent] = useState("");
  const [initialSelectedSong, setInitialSelectedSong] = useState("");

  const {
    students,
    teacherProfile,
    videos,
    archivedSongsList,
    notifications,
    loading,
    setNotifications,
    fetchTeacherData
  } = useTeacherData(user);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  // When clicking Comments Inbox in the sidebar, open the modal and reset active tab
  useEffect(() => {
    if (activeTab === "inbox") {
      setIsInboxOpen(true);
      setActiveTab("roster");
    }
  }, [activeTab]);



  const handleMarkNotificationRead = async (videoId) => {
    try {
      await markCommentsRead(videoId, "teacher");
      const notifs = await getTeacherNotifications(user.username);
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const uniqueVideoIds = Array.from(new Set(notifications.map(n => n.videoId)));
      await Promise.all(uniqueVideoIds.map(vId => markCommentsRead(vId, "teacher")));
      setNotifications([]);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleGoToVideo = async (videoNotif) => {
    setIsInboxOpen(false);
    setInitialBrowseStudent(videoNotif.studentUsername);
    setInitialSelectedSong(videoNotif.songName);
    setActiveTab("videos");

    try {
      await markCommentsRead(videoNotif.videoId, "teacher");
      const notifs = await getTeacherNotifications(user.username);
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to mark notification read in go-to-video:", err);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* LEFT SIDEBAR SECTION */}
        <TeacherSidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNotificationsCount={notifications.length}
          onLogout={onLogout}
        />

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 w-full">
          {loading && students.length === 0 ? (
            <div className="text-xl font-bold text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/40">
              Syncing classroom data...
            </div>
          ) : (
            <>
              {activeTab === "roster" && (
                <RosterTab
                  students={students}
                  setSelectedStudent={setSelectedStudent}
                />
              )}

              {activeTab === "homework" && (
                <AssignHomeworkTab
                  students={students}
                  videos={videos}
                  archivedSongs={archivedSongsList}
                  user={user}
                  fetchData={fetchTeacherData}
                />
              )}

              {activeTab === "videos" && (
                <TeacherVideosTab
                  students={students}
                  videos={videos}
                  archivedSongs={archivedSongsList}
                  fetchData={fetchTeacherData}
                  user={user}
                  initialBrowseStudent={initialBrowseStudent}
                  initialSelectedSong={initialSelectedSong}
                />
              )}

              {activeTab === "profile" && (
                <TeacherProfileTab
                  user={user}
                  teacherProfile={teacherProfile}
                  fetchData={fetchTeacherData}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* DETAILED STUDENT DIALOG POPUP */}
      <StudentDetailModal
        selectedStudent={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      {/* NOTIFICATION INBOX DIALOG POPUP */}
      <CommentInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        unreadNotifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onGoToVideo={handleGoToVideo}
      />
    </div>
  );
}
