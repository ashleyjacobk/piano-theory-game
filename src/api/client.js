const BASE_URL = "http://localhost:4000";

export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Auto Content-Type header if body is provided and is a standard object
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    const config = {
        ...options,
        headers,
    };

    if (config.body && typeof config.body === "object") {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Request to ${endpoint} failed:`, error);
        throw error;
    }
}
