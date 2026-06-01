import { apiRequest } from "./client";

export function getVideos({ username, teacherCode } = {}) {
    const params = [];
    if (username) params.push(`username=${encodeURIComponent(username)}`);
    if (teacherCode) params.push(`teacherCode=${encodeURIComponent(teacherCode)}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return apiRequest(`/api/videos${query}`);
}

export function getVideoComments(videoId) {
    return apiRequest(`/api/videos/${videoId}/comments`);
}

export function addVideoComment(videoId, commentData) {
    return apiRequest(`/api/videos/${videoId}/comments`, {
        method: "POST",
        body: commentData
    });
}

export function markCommentsRead(videoId, role) {
    return apiRequest(`/api/videos/${videoId}/comments/read`, {
        method: "POST",
        body: { role }
    });
}

export function uploadVideo(videoData) {
    return apiRequest("/api/videos", {
        method: "POST",
        body: videoData
    });
}

export function getTeacherNotifications(username) {
    return apiRequest(`/api/notifications/teacher/${encodeURIComponent(username)}`);
}

export function getStudentNotifications(username) {
    return apiRequest(`/api/notifications/student/${encodeURIComponent(username)}`);
}
