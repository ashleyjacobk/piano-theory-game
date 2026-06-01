import { useState, useCallback } from "react";
import { getStudentRoster, getTeacherProfile, getArchivedSongs } from "../api/profileApi";
import { getVideos, getTeacherNotifications } from "../api/videosApi";

export default function useTeacherData(user) {
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [archivedSongsList, setArchivedSongsList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTeacherData = useCallback(async () => {
    if (!user || !user.username) return;
    setLoading(true);
    try {
      const [
        roster,
        profile,
        vids,
        archive,
        notifs
      ] = await Promise.all([
        getStudentRoster(user.teacherCode),
        getTeacherProfile(user.username),
        getVideos({ teacherCode: user.teacherCode }),
        getArchivedSongs(),
        getTeacherNotifications(user.username).catch(() => [])
      ]);

      setStudents(roster);
      setTeacherProfile(profile);
      setVideos(vids);
      setArchivedSongsList(archive);
      setNotifications(notifs);
    } catch (err) {
      console.error("useTeacherData: Error loading teacher details:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    students,
    teacherProfile,
    videos,
    archivedSongsList,
    notifications,
    loading,
    setStudents,
    setTeacherProfile,
    setVideos,
    setArchivedSongsList,
    setNotifications,
    fetchTeacherData
  };
}
