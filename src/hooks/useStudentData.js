import { useState, useCallback } from "react";
import { getStudentProfile, getFreePracticeScores, getPracticeLogs, getArchivedSongs } from "../api/profileApi";
import { getHomework } from "../api/homeworkApi";
import { getVideos, getStudentNotifications } from "../api/videosApi";

export default function useStudentData(username) {
  const [profileData, setProfileData] = useState(null);
  const [freePracticeHistory, setFreePracticeHistory] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [hwActiveItem, setHwActiveItem] = useState(null);
  const [practiceLogs, setPracticeLogs] = useState([]);
  const [videos, setVideos] = useState([]);
  const [archivedSongs, setArchivedSongs] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStudentData = useCallback(async (isPlayingHW = false) => {
    if (!username) return;
    setLoading(true);
    try {
      const [
        profile,
        freePractice,
        homework,
        logs,
        vids,
        archive,
        notifs
      ] = await Promise.all([
        getStudentProfile(username),
        getFreePracticeScores(username),
        getHomework(username),
        getPracticeLogs(username),
        getVideos({ username }),
        getArchivedSongs(),
        getStudentNotifications(username).catch(() => [])
      ]);

      setProfileData(profile);
      setFreePracticeHistory(freePractice);
      setHomeworkList(homework);
      
      if (!isPlayingHW) {
        const active = homework.find((h) => !h.completed);
        setHwActiveItem(active || null);
      }

      setPracticeLogs(logs);
      setVideos(vids);
      setArchivedSongs(archive);
      setUnreadNotifications(notifs);
    } catch (err) {
      console.error("useStudentData: Error loading student details:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  return {
    profileData,
    freePracticeHistory,
    homeworkList,
    hwActiveItem,
    setHwActiveItem,
    practiceLogs,
    videos,
    archivedSongs,
    unreadNotifications,
    loading,
    fetchStudentData
  };
}
