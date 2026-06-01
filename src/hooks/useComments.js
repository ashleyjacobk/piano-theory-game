import { useState, useCallback } from "react";
import { getVideoComments, addVideoComment, markCommentsRead } from "../api/videosApi";

export default function useComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (videoId) => {
    if (!videoId) return;
    setLoading(true);
    try {
      const data = await getVideoComments(videoId);
      setComments(data);
    } catch (err) {
      console.error("useComments: Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const postComment = useCallback(async (videoId, { username, name, text }) => {
    if (!videoId || !text.trim()) return null;
    try {
      const newComment = await addVideoComment(videoId, { username, name, text });
      setComments((prev) => [...prev, newComment]);
      return newComment;
    } catch (err) {
      console.error("useComments: Error posting comment:", err);
      throw err;
    }
  }, []);

  const markRead = useCallback(async (videoId, role) => {
    if (!videoId || !role) return;
    try {
      await markCommentsRead(videoId, role);
    } catch (err) {
      console.error("useComments: Error marking comments as read:", err);
    }
  }, []);

  return {
    comments,
    setComments,
    loading,
    fetchComments,
    postComment,
    markRead
  };
}
