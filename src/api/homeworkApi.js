import { apiRequest } from "./client";

export function getHomework(username) {
    return apiRequest(`/api/homework/${encodeURIComponent(username)}`);
}

export function assignHomework(homeworkData) {
    return apiRequest("/api/homework", {
        method: "POST",
        body: homeworkData
    });
}

export function updateHomeworkProgress(id, username) {
    return apiRequest("/api/homework/progress", {
        method: "POST",
        body: { id, username }
    });
}
