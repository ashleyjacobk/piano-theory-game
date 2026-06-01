import { apiRequest } from "./client";

export function getStudentProfile(username) {
    return apiRequest(`/api/student-profile/${encodeURIComponent(username)}`);
}

export function getTeacherProfile(username) {
    return apiRequest(`/api/teacher-profile/${encodeURIComponent(username)}`);
}

export function updateTeacherProfile(profileData) {
    return apiRequest("/api/teacher-profile", {
        method: "POST",
        body: profileData
    });
}

export function deleteUserAccount(username) {
    return apiRequest(`/api/users/${encodeURIComponent(username)}`, {
        method: "DELETE"
    });
}

// Roster Mappings (Teacher View)
export function getStudentRoster(teacherCode) {
    return apiRequest(`/api/students?teacherCode=${encodeURIComponent(teacherCode)}`);
}

export function updateStudentLessonDay(username, lessonDay) {
    return apiRequest(`/api/students/${encodeURIComponent(username)}/lesson-day`, {
        method: "POST",
        body: { lessonDay }
    });
}

// Practice Logs Mappings (Student View)
export function getPracticeLogs(username) {
    return apiRequest(`/api/practice-logs/${encodeURIComponent(username)}`);
}

export function addPracticeLog(logData) {
    return apiRequest("/api/practice-logs", {
        method: "POST",
        body: logData
    });
}

// Free Practice / Arcade Mappings (Student View)
export function getFreePracticeScores(username) {
    return apiRequest(`/api/free-practice/${encodeURIComponent(username)}`);
}

export function addFreePracticeScore(scoreData) {
    return apiRequest("/api/free-practice", {
        method: "POST",
        body: scoreData
    });
}

// Song Archives Mappings (Teacher View)
export function getArchivedSongs() {
    return apiRequest("/api/songs/archive");
}

export function setSongArchiveState(songName, archived) {
    return apiRequest("/api/songs/archive", {
        method: "POST",
        body: { songName, archived }
    });
}
