import { apiRequest } from "./client";

export function login(username, password) {
    return apiRequest("/api/login", {
        method: "POST",
        body: { username, password }
    });
}

export function register(userData) {
    return apiRequest("/api/register", {
        method: "POST",
        body: userData
    });
}
