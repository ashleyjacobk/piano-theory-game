import React, { useState } from "react";
import useComments from "../../hooks/useComments";

function VideoCard({ video, user, onCommentCountChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const { comments, loading, fetchComments, postComment, markRead } = useComments();

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchComments(video.id);
      markRead(video.id, "student");
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      await postComment(video.id, {
        username: user.username,
        name: user.name,
        text: inputText.trim()
      });
      setInputText("");
      if (onCommentCountChange) {
        onCommentCountChange(video.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCommentDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="border-3 border-slate-800 rounded-[1.5rem] p-4 bg-emerald-50/10 shadow-[3px_3px_0px_#fef08a] hover:scale-[1.01] transition-all flex flex-col justify-between text-left">
      <div>
        <h4 className="font-black text-sm mb-1 text-slate-800">{video.title}</h4>
        
        {video.composer && (
          <div className="mb-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded w-fit select-none">
            Composer: {video.composer}
          </div>
        )}

        <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-slate-800 shadow-[2px_2px_0px_#a7f3d0] bg-black">
          {video.url.includes("youtube.com/embed/") ? (
            <iframe
              src={video.url}
              title={video.title}
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              src={video.url}
              controls
              className="absolute top-0 left-0 w-full h-full object-contain"
            ></video>
          )}
        </div>
      </div>

      {/* Collapsible Comments Section */}
      <div className="mt-4 border-t-2 border-slate-100 pt-3">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 transition cursor-pointer select-none"
        >
          Comments ({comments.length > 0 ? comments.length : video.commentsCount || 0})
        </button>

        {isOpen && (
          <div className="mt-3 bg-white border-3 border-slate-800 p-3 rounded-2xl shadow-[2px_2px_0px_#a7f3d0]">
            <div className="max-h-36 overflow-y-auto space-y-2.5 pr-1">
              {loading ? (
                <p className="text-[10px] font-bold text-emerald-600 animate-pulse text-center">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 italic text-center py-1">No comments yet. Ask a question.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="text-[11px] bg-emerald-50/30 p-2 rounded-xl border-2 border-slate-800">
                    <div className="flex justify-between font-black text-[9px] text-emerald-600 mb-1">
                      <span>{comment.name} (@{comment.username})</span>
                      <span className="text-[8px] font-semibold text-slate-400">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-bold">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                placeholder="Ask a question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-emerald-50/10 border-2 border-slate-800 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                className="px-3 py-1 bg-amber-300 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 rounded-xl text-xs font-black transition active:scale-[0.95] cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentVideosTab({
  user,
  videos = [],
  unreadNotifications = [],
  archivedSongs = [],
  fetchStudentData
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedSong, setSelectedSong] = useState("");

  const activeSongs = Array.from(
    new Set(videos.filter((v) => !archivedSongs.includes(v.songName)).map((v) => v.songName))
  ).filter(Boolean);

  const archivedSongsList = Array.from(
    new Set(videos.filter((v) => archivedSongs.includes(v.songName)).map((v) => v.songName))
  ).filter(Boolean);

  const allSongNames = showArchived ? archivedSongsList : activeSongs;

  // Group videos by song name
  const groupedVideos = videos.reduce((acc, video) => {
    if (!acc[video.songName]) {
      acc[video.songName] = [];
    }
    acc[video.songName].push(video);
    return acc;
  }, {});

  const handleGoToVideo = (notif) => {
    const song = notif.songName;
    const isArchivedSong = archivedSongs.includes(song);
    setShowArchived(isArchivedSong);
    setSelectedSong(song);

    // Scroll to video card after a brief timeout
    setTimeout(() => {
      const el = document.getElementById(`video-card-${notif.videoId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-yellow-300");
        setTimeout(() => el.classList.remove("ring-4", "ring-yellow-300"), 3000);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {unreadNotifications.length > 0 && (
        <div className="space-y-3">
          {unreadNotifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-yellow-50 border-4 border-slate-800 rounded-[2rem] p-5 shadow-[4px_4px_0px_#1e293b] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 select-none">
                  <span className="bg-yellow-200 border-2 border-slate-800 text-[9px] px-2 py-0.5 rounded-full font-black uppercase text-slate-700">
                    Teacher Commented
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(notif.createdAt).toLocaleDateString()}{" "}
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  Teacher <span className="text-emerald-600 font-black">{notif.name}</span> commented on{" "}
                  <span className="font-black text-slate-900">"{notif.videoTitle}"</span> under song{" "}
                  <span className="font-black text-emerald-600">"{notif.songName}"</span>:
                </p>
                <p className="text-xs text-slate-600 font-semibold italic mt-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-inner">
                  "{notif.text}"
                </p>
              </div>
              <button
                onClick={() => handleGoToVideo(notif)}
                className="w-full md:w-auto px-4 py-2.5 bg-emerald-300 hover:bg-emerald-400 text-slate-800 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#1e293b] active:translate-y-0.5 hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
              >
                Go to Video
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Song Selection & Switcher Bar */}
      <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0]">
        <div className="flex justify-between items-center border-b-3 border-slate-100 pb-3 mb-4 font-black text-xs text-slate-600 select-none">
          <span>{showArchived ? "Archived Songs Folder" : "Active Songs Folder"}</span>
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setSelectedSong("");
            }}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-slate-800 border-2 border-slate-800 rounded-xl text-[10px] font-black shadow-[2px_2px_0px_#a7f3d0] active:translate-y-0.5 hover:scale-[1.02] transition-all cursor-pointer"
          >
            {showArchived ? "View Active Songs" : "View Archived Songs"}
          </button>
        </div>

        {/* Horizontal buttons to select songs */}
        <div className="flex flex-wrap gap-2 select-none">
          {showArchived ? (
            archivedSongsList.length === 0 ? (
              <span className="text-xs font-bold text-slate-400 italic">No archived song folders.</span>
            ) : (
              archivedSongsList.map((song) => (
                <button
                  key={song}
                  onClick={() => setSelectedSong(song)}
                  className={`px-3 py-1.5 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.03] active:translate-y-0.5 ${
                    selectedSong === song
                      ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]"
                      : "bg-white text-slate-800"
                  }`}
                >
                  {song}
                </button>
              ))
            )
          ) : activeSongs.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 italic">No song lessons shared yet.</span>
          ) : (
            activeSongs.map((song) => (
              <button
                key={song}
                onClick={() => setSelectedSong(song)}
                className={`px-3 py-1.5 border-2 border-slate-800 rounded-xl text-xs font-black shadow-[2px_2px_0px_#a7f3d0] transition cursor-pointer hover:scale-[1.03] active:translate-y-0.5 ${
                  selectedSong === song
                    ? "bg-emerald-300 text-slate-800 shadow-[1px_1px_0px_#slate-800]"
                    : "bg-white text-slate-800"
                }`}
              >
                {song}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Embed videos list for selected song */}
      {selectedSong ? (
        <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-6 shadow-[6px_6px_0px_#a7f3d0]">
          <h3 className="text-xl font-black text-emerald-600 mb-6 border-b-3 border-slate-100 pb-2 uppercase tracking-wide text-left">
            {selectedSong}{" "}
            {showArchived && (
              <span className="text-[10px] bg-red-500 border border-slate-800 px-2 py-0.5 rounded-lg text-white ml-2">
                Archived
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedVideos[selectedSong] &&
              groupedVideos[selectedSong].map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  user={user}
                  onCommentCountChange={fetchStudentData}
                />
              ))}
          </div>
        </div>
      ) : (
        allSongNames.length > 0 && (
          <div className="text-center p-8 bg-white border-4 border-slate-800 rounded-[2.5rem] shadow-[6px_6px_0px_#a7f3d0] select-none">
            <p className="font-bold text-slate-400">Please select a song folder from the vault above.</p>
          </div>
        )
      )}
    </div>
  );
}
