// Helper to convert regular YouTube URLs to Embed URLs
function getEmbedUrl(url) {
    if (!url) return "";

    // If it's already an embed link, return it
    if (url.includes("youtube.com/embed/")) {
        return url;
    }

    // Standard Watch Link: youtube.com/watch?v=VIDEO_ID
    let videoId = "";
    if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1].split("&")[0];
    }
    // Short Link: youtu.be/VIDEO_ID
    else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }
    // Embed format fallback
    else {
        return url;
    }

    return `https://www.youtube.com/embed/${videoId}`;
}

module.exports = {
    getEmbedUrl
};
